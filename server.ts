import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key-do-not-use-in-prod';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const db = new Database(':memory:');
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn('STRIPE_SECRET_KEY environment variable is missing. Stripe features will fail.');
      // Fallback for demo purposes if key is missing, though it will throw an error when used
      stripeClient = new Stripe('sk_test_mock_key'); 
    } else {
      stripeClient = new Stripe(key);
    }
  }
  return stripeClient;
}

// Initialize Database
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'user',
    credits INTEGER DEFAULT 10,
    badges TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE benchmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    industry TEXT,
    subdomain TEXT,
    name TEXT,
    description TEXT,
    status TEXT DEFAULT 'approved',
    author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(author_id) REFERENCES users(id)
  );

  CREATE TABLE challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_name TEXT,
    description TEXT,
    badge_name TEXT,
    target_score REAL,
    target_cost REAL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    key_hash TEXT UNIQUE,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    benchmark_id INTEGER,
    parent_id INTEGER,
    version INTEGER DEFAULT 1,
    agent_name TEXT,
    submission_type TEXT,
    source_url TEXT,
    status TEXT,
    score REAL,
    cost REAL,
    logs TEXT,
    feedback_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(benchmark_id) REFERENCES benchmarks(id),
    FOREIGN KEY(parent_id) REFERENCES submissions(id)
  );
`);

// Seed initial data
const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role, credits, badges) VALUES (?, ?, ?, ?, ?, ?)');
const defaultPassword = bcrypt.hashSync('password123', 10);
insertUser.run('Demo Developer', 'demo@example.com', defaultPassword, 'user', 50, JSON.stringify(['Early Adopter', 'Top Planner']));
insertUser.run('Admin User', 'admin@example.com', defaultPassword, 'admin', 9999, JSON.stringify(['Admin']));

const insertBenchmark = db.prepare('INSERT INTO benchmarks (industry, subdomain, name, description) VALUES (?, ?, ?, ?)');
insertBenchmark.run('Healthcare', 'Payer', 'Claims Adjudication Agent', 'Evaluate agent accuracy in processing medical claims.');
insertBenchmark.run('Healthcare', 'Provider', 'Clinical Documentation', 'Evaluate agent ability to extract ICD-10 codes from notes.');
insertBenchmark.run('Finance', 'Trading', 'Algorithmic Trading Bot', 'Evaluate trading decisions based on historical data.');

const insertApiKey = db.prepare('INSERT INTO api_keys (user_id, key_hash, name) VALUES (?, ?, ?)');
insertApiKey.run(1, 'demo-hash-123', 'CI/CD Pipeline Key');

const insertSubmission = db.prepare('INSERT INTO submissions (user_id, benchmark_id, parent_id, version, agent_name, submission_type, source_url, status, score, cost, logs, feedback_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

db.prepare(`
  INSERT INTO challenges (season_name, description, badge_name, target_score, target_cost, is_active)
  SELECT 'Spring 2026 Sprint', 'Achieve a score of 90+ with a cost under $0.15', 'Spring ''26 Champion', 90.0, 0.15, 1
  WHERE NOT EXISTS (SELECT 1 FROM challenges)
`).run();

const sampleFeedback = JSON.stringify({
  llm_judge_summary: "The agent successfully navigated the environment and completed the core objectives. Tool selection was highly accurate, minimizing unnecessary API calls. However, the agent struggled slightly with edge cases involving malformed input data.",
  trace: ["Init Agent", "Fetch Claim Data", "Call LLM Judge", "Extract ICD-10", "Format Output"],
  error_categories: ["Malformed Input Handling"],
  per_task_results: [
    { task: "Login to sandbox", status: "Pass" },
    { task: "Locate claim #9921", status: "Pass" },
    { task: "Extract diagnosis codes", status: "Pass" },
    { task: "Submit adjudication decision", status: "Fail" }
  ]
});

insertSubmission.run(1, 1, null, 1, 'ClaimBot', 'docker', 'docker.io/demo/claimbot:v1', 'Completed', 92.5, 0.45, 'Agent successfully processed 925/1000 claims. Cost: $0.45', sampleFeedback);
insertSubmission.run(1, 2, null, 1, 'DocuExtract', 'github', 'https://github.com/demo/docuextract', 'Completed', 88.0, 0.30, 'Agent extracted 88% of correct ICD-10 codes. Cost: $0.30', sampleFeedback);
insertSubmission.run(1, 1, 1, 2, 'ClaimBot', 'docker', 'docker.io/demo/claimbot:v2', 'Running', null, null, 'Running evaluation...', null);

// --- Background Worker Queue (Simulates RabbitMQ/K8s Workers) ---
class JobQueue {
  private queue: { submissionId: number | bigint, userId: number }[] = [];
  private processing: boolean = false;

  add(job: { submissionId: number | bigint, userId: number }) {
    this.queue.push(job);
    this.processNext();
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    
    const job = this.queue.shift();
    if (job) {
      try {
        await this.processJob(job);
      } catch (err) {
        console.error('Job processing error:', err);
      }
    }
    
    this.processing = false;
    this.processNext();
  }

  private async processJob(job: { submissionId: number | bigint, userId: number }) {
    // 1. Mark as Running
    db.prepare("UPDATE submissions SET status = 'Running', logs = 'Container started. Pulling image and mounting sandbox...' WHERE id = ?").run(job.submissionId);
    
    // 2. Resource Quota: Strict Timeout Enforcement
    // Simulate a hard timeout of 5 seconds. In reality, this would be enforced by cgroups/Firecracker.
    let isTimedOut = false;
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      db.prepare("UPDATE submissions SET status = 'Failed', logs = 'Execution terminated: Maximum timeout exceeded (5s). Agent process killed by cgroups.' WHERE id = ?").run(job.submissionId);
    }, 5000);

    // 3. Simulate Docker container spin-up and execution (wait 4.5 seconds to usually pass, but sometimes fail)
    const executionTime = Math.random() * 2000 + 3500; // 3.5s to 5.5s
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    if (isTimedOut) return; // The timeout handler already marked it as failed
    clearTimeout(timeoutId);

    // 4. Check if it was flagged/cancelled by admin during execution
    const currentStatus = db.prepare("SELECT status FROM submissions WHERE id = ?").get(job.submissionId) as { status: string } | undefined;
    if (currentStatus?.status === 'Flagged') return; // Stop processing

    // 5. Generate results (The "Judge" Isolation)
    // The judge runs outside the sandbox and evaluates the output.
    const isSuccess = Math.random() > 0.1; // 90% success rate
    const score = isSuccess ? (Math.random() * 20 + 80) : (Math.random() * 40 + 20);
    const cost = Math.random() * 0.5 + 0.1;
    const status = isSuccess ? 'Completed' : 'Failed';
    
    const logs = isSuccess 
      ? `Evaluation complete. Score: ${score.toFixed(2)}. Cost: $${cost.toFixed(2)}`
      : "[ERROR] Agent crashed during execution: Timeout exceeded.";

    const feedback = JSON.stringify({
      llm_judge_summary: isSuccess 
        ? "Automated evaluation completed. Agent demonstrated strong reasoning capabilities but encountered minor formatting issues in the final output."
        : "The agent failed to complete the task due to a timeout.",
      trace: ["Init Agent", "Analyze Task", "Execute Tool", "Validate Output", "Complete"],
      error_categories: isSuccess ? ["Formatting"] : ["Timeout"],
      per_task_results: [
        { task: "Navigate to portal and authenticate", status: "Pass" },
        { task: "Extract patient claim ID", status: "Pass" },
        { task: "Identify ICD-10 codes", status: isSuccess ? "Pass" : "Fail" },
        { task: "Determine denial reason", status: "Fail" }
      ]
    });

    // 5. Update DB
    db.prepare('UPDATE submissions SET status = ?, score = ?, cost = ?, logs = ?, feedback_json = ? WHERE id = ?').run(
      status, score.toFixed(2), cost.toFixed(2), logs, feedback, job.submissionId
    );

    // 6. Gamification & Badges Engine
    if (isSuccess) {
      const userRecord = db.prepare('SELECT badges FROM users WHERE id = ?').get(job.userId) as { badges: string } | undefined;
      let badges: string[] = [];
      try {
        badges = JSON.parse(userRecord?.badges || '[]');
      } catch (e) {
        badges = [];
      }

      let newBadges = [...badges];

      // Rule 1: High Score Badge
      if (score >= 95 && !badges.includes('Elite Performer')) {
        newBadges.push('Elite Performer');
      }

      // Rule 2: Cost Efficiency Badge
      if (cost <= 0.20 && score >= 80 && !badges.includes('Cost Efficient')) {
        newBadges.push('Cost Efficient');
      }

      // Rule 3: First Submission Badge
      const submissionCount = (db.prepare('SELECT COUNT(*) as count FROM submissions WHERE user_id = ?').get(job.userId) as { count: number }).count;
      if (submissionCount === 1 && !badges.includes('First Run')) {
        newBadges.push('First Run');
      }

      // Rule 4: Top Planner
      if (score >= 88 && cost <= 0.25 && !badges.includes('Top Planner')) {
        newBadges.push('Top Planner');
      }

      // Rule 5: Seasonal Challenge
      const activeChallenge = db.prepare('SELECT * FROM challenges WHERE is_active = 1 ORDER BY id DESC LIMIT 1').get() as any;
      if (activeChallenge) {
        if (score >= activeChallenge.target_score && cost <= activeChallenge.target_cost && !badges.includes(activeChallenge.badge_name)) {
          newBadges.push(activeChallenge.badge_name);
        }
      }

      // Update user badges if any new ones were awarded
      if (newBadges.length > badges.length) {
        db.prepare('UPDATE users SET badges = ? WHERE id = ?').run(JSON.stringify(newBadges), job.userId);
      }
    }
  }
}

const evaluationQueue = new JobQueue();
// ----------------------------------------------------------------

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Authentication Middleware (Supports both JWT for Web and API Keys for CLI)
  const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Invalid authorization format. Use Bearer <token>' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // 1. Try to verify as a JWT (Web Session)
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number, role: string };
      req.user = { id: decoded.id, role: decoded.role };
      return next();
    } catch (err) {
      // 2. If JWT fails, check if it's an API Key (CLI/CI-CD)
      const apiKeyRecord = db.prepare('SELECT user_id FROM api_keys WHERE key_hash = ?').get(token);
      if (apiKeyRecord) {
        req.user = { id: apiKeyRecord.user_id, role: 'user' }; // API keys default to user role
        return next();
      }
      return res.status(401).json({ error: 'Invalid or expired token/API key' });
    }
  };

  // Admin Middleware
  const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    authenticate(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
      next();
    });
  };

  // Auth Routes
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
      const password_hash = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, password_hash);
      const token = jwt.sign({ id: result.lastInsertRowid, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: result.lastInsertRowid, name, email, role: 'user' } });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  // Stripe Checkout Endpoint
  app.post('/api/checkout', async (req, res) => {
    try {
      const { plan } = req.body; // 'pay-as-you-go' or 'pro'
      const stripe = getStripe();
      
      let amount = 0;
      let credits = 0;
      let name = '';

      if (plan === 'pay-as-you-go') {
        amount = 500; // $5.00
        credits = 25;
        name = '25 Benchmark Runs';
      } else if (plan === 'pro') {
        amount = 2000; // $20.00
        credits = 150;
        name = '150 Benchmark Runs (Pro)';
      } else {
        return res.status(400).json({ error: 'Invalid plan selected' });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: name,
                description: `Adds ${credits} credits to your AgentBench account.`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/profile?success=true&credits=${credits}`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/profile?canceled=true`,
        metadata: {
          user_id: 1, // Hardcoded for demo
          credits: credits
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Stripe error:', error);
      res.status(500).json({ error: error.message || 'Failed to create checkout session' });
    }
  });

  // Stripe Webhook (Mocked for local dev, normally requires raw body parsing)
  app.post('/api/webhooks/stripe', (req, res) => {
    const event = req.body;
    
    // In production, you MUST verify the Stripe signature using req.rawBody
    // const signature = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.user_id;
      const creditsToAdd = parseInt(session.metadata.credits, 10);

      if (userId && creditsToAdd) {
        db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(creditsToAdd, userId);
        console.log(`Added ${creditsToAdd} credits to user ${userId}`);
      }
    }

    res.json({ received: true });
  });

  // Admin Routes
  app.post('/api/admin/challenges/reset', authenticateAdmin, (req, res) => {
    const { season_name, description, badge_name, target_score, target_cost } = req.body;
    db.prepare('UPDATE challenges SET is_active = 0 WHERE is_active = 1').run();
    db.prepare('INSERT INTO challenges (season_name, description, badge_name, target_score, target_cost, is_active) VALUES (?, ?, ?, ?, ?, 1)').run(season_name, description, badge_name, target_score, target_cost);
    res.json({ success: true });
  });

  app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalSubmissions = db.prepare('SELECT COUNT(*) as count FROM submissions').get().count;
    const activeJobs = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status = 'Pending' OR status = 'Running'").get().count;
    const totalRevenue = db.prepare('SELECT SUM(cost) as total FROM submissions WHERE cost IS NOT NULL').get().total || 0;
    
    res.json({ totalUsers, totalSubmissions, activeJobs, totalRevenue });
  });

  app.get('/api/admin/jobs', authenticateAdmin, (req, res) => {
    const jobs = db.prepare(`
      SELECT s.*, u.name as user_name, u.email as user_email, b.name as benchmark_name
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN benchmarks b ON s.benchmark_id = b.id
      ORDER BY s.created_at DESC
      LIMIT 50
    `).all();
    res.json(jobs);
  });

  app.post('/api/admin/jobs/:id/flag', authenticateAdmin, (req, res) => {
    db.prepare("UPDATE submissions SET status = 'Flagged', logs = 'Flagged by admin for malicious activity.' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/admin/benchmarks/pending', authenticateAdmin, (req, res) => {
    const pending = db.prepare(`
      SELECT b.*, u.name as author_name, u.email as author_email 
      FROM benchmarks b 
      LEFT JOIN users u ON b.author_id = u.id 
      WHERE b.status = 'pending'
      ORDER BY b.created_at DESC
    `).all();
    res.json(pending);
  });

  app.post('/api/admin/benchmarks/:id/approve', authenticateAdmin, (req, res) => {
    db.prepare("UPDATE benchmarks SET status = 'approved' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/admin/benchmarks/:id/reject', authenticateAdmin, (req, res) => {
    db.prepare("UPDATE benchmarks SET status = 'rejected' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // API Routes
  app.get('/api/challenges', authenticate, (req, res) => {
    const activeChallenge = db.prepare('SELECT * FROM challenges WHERE is_active = 1 ORDER BY id DESC LIMIT 1').get();
    res.json(activeChallenge || null);
  });

  app.get('/api/user', authenticate, (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    res.json({ ...user, badges: JSON.parse(user.badges) });
  });

  app.get('/api/user/apikeys', authenticate, (req, res) => {
    const keys = db.prepare('SELECT id, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(keys);
  });

  app.post('/api/user/apikeys', authenticate, (req, res) => {
    const rawKey = 'ab_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    db.prepare('INSERT INTO api_keys (user_id, key_hash) VALUES (?, ?)').run(req.user.id, rawKey);
    res.json({ key: rawKey });
  });

  app.delete('/api/user/apikeys/:id', authenticate, (req, res) => {
    db.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  app.get('/api/benchmarks', (req, res) => {
    const benchmarks = db.prepare("SELECT * FROM benchmarks WHERE status = 'approved'").all();
    res.json(benchmarks);
  });

  app.post('/api/benchmarks', authenticate, (req, res) => {
    const { industry, subdomain, name, description } = req.body;
    if (!industry || !subdomain || !name || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = db.prepare("INSERT INTO benchmarks (industry, subdomain, name, description, status, author_id) VALUES (?, ?, ?, ?, 'pending', ?)").run(industry, subdomain, name, description, req.user.id);
    res.json({ id: result.lastInsertRowid, status: 'pending' });
  });

  app.get('/api/leaderboards', (req, res) => {
    const { industry, subdomain } = req.query;
    let query = `
      SELECT s.id, s.agent_name, s.score, s.cost, u.name as developer, b.name as benchmark_name
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN benchmarks b ON s.benchmark_id = b.id
      WHERE s.status = 'Completed'
    `;
    const params = [];

    if (industry) {
      query += ' AND b.industry = ?';
      params.push(industry);
    }
    if (subdomain) {
      query += ' AND b.subdomain = ?';
      params.push(subdomain);
    }

    query += ' ORDER BY s.score DESC LIMIT 50';

    const leaderboards = db.prepare(query).all(...params);
    res.json(leaderboards);
  });

  app.get('/api/submissions', authenticate, (req, res) => {
    const submissions = db.prepare(`
      SELECT s.*, b.name as benchmark_name, b.industry, b.subdomain 
      FROM submissions s
      JOIN benchmarks b ON s.benchmark_id = b.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).all(req.user.id);
    res.json(submissions);
  });

  app.get('/api/submissions/:id', authenticate, (req, res) => {
    const submission = db.prepare(`
      SELECT s.*, b.name as benchmark_name, b.industry, b.subdomain 
      FROM submissions s
      JOIN benchmarks b ON s.benchmark_id = b.id
      WHERE s.id = ? AND s.user_id = ?
    `).get(req.params.id, req.user.id);
    
    if (!submission) return res.status(404).json({ error: 'Not found' });

    // Fetch version history for this agent
    const history = db.prepare(`
      SELECT id, version, score, cost, status, created_at 
      FROM submissions 
      WHERE user_id = ? AND agent_name = ? 
      ORDER BY version DESC
    `).all(req.user.id, submission.agent_name);

    res.json({ ...submission, history });
  });

  app.post('/api/submissions', authenticate, (req, res) => {
    const { benchmark_id, agent_name, source_url, type } = req.body;
    const userId = req.user.id;
    
    // 1. Artifact Scanning (Pre-Execution Static Analysis)
    // Reject payloads containing obvious malicious patterns before they ever reach the worker queue.
    const MALICIOUS_PATTERNS = [/rm\s+-rf/, /eval\s*\(/, /exec\s*\(/, /os\.system/, /__proto__/];
    const contentToScan = `${agent_name} ${source_url}`;
    for (const pattern of MALICIOUS_PATTERNS) {
      if (pattern.test(contentToScan)) {
        return res.status(403).json({ error: 'Security Violation: Malicious code pattern detected in submission payload.' });
      }
    }

    // 2. Input Size Limits (Prevent DOS)
    if (source_url.length > 2048 || agent_name.length > 255) {
      return res.status(400).json({ error: 'Payload too large. Maximum URL length is 2048 characters.' });
    }

    // Deduct credit
    const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(userId);
    if (user.credits < 1) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }
    
    db.prepare('UPDATE users SET credits = credits - 1 WHERE id = ?').run(userId);

    // Versioning logic
    const prev = db.prepare('SELECT id, version FROM submissions WHERE user_id = ? AND agent_name = ? ORDER BY version DESC LIMIT 1').get(userId, agent_name);
    const parent_id = prev ? prev.id : null;
    const version = prev ? prev.version + 1 : 1;

    const result = db.prepare('INSERT INTO submissions (user_id, benchmark_id, parent_id, version, agent_name, submission_type, source_url, status, logs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      userId, benchmark_id, parent_id, version, agent_name, type || 'docker', source_url, 'Pending', `Submitted agent from ${source_url}. Waiting for evaluation engine...`
    );

    // Add to background worker queue
    evaluationQueue.add({ submissionId: result.lastInsertRowid, userId });

    res.json({ id: result.lastInsertRowid, status: 'Pending', version });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
