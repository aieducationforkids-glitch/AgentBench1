import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Shield, CreditCard, Award, Settings, LogOut, CheckCircle2, Key, Plus, Trash2, Copy, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { token, logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [challenge, setChallenge] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newKey, setNewKey] = useState('');

  const fetchApiKeys = async () => {
    if (!token) return;
    const res = await fetch('/api/user/apikeys', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setApiKeys(await res.json());
  };

  useEffect(() => {
    if (!token) return;
    fetch('/api/user', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setUser);
    
    fetch('/api/challenges', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setChallenge);
    
    fetchApiKeys();
    
    // Handle Stripe redirect success
    if (searchParams.get('success') === 'true') {
      const credits = searchParams.get('credits');
      setSuccessMessage(`Successfully purchased ${credits} credits! Your balance has been updated.`);
      // In a real app, the webhook would have updated the DB. 
      // For this demo, we'll optimistically update the UI if the webhook hasn't fired yet.
      setUser((prev: any) => prev ? { ...prev, credits: prev.credits + parseInt(credits || '0') } : null);
    }
  }, [searchParams]);

  const handleCheckout = async (plan: string) => {
    setIsCheckingOut(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan })
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        throw new Error(data.error || 'Failed to initiate checkout');
      }
    } catch (error) {
      console.error(error);
      alert('Checkout failed. Please check your Stripe configuration.');
      setIsCheckingOut(false);
    }
  };

  const handleGenerateKey = async () => {
    try {
      const res = await fetch('/api/user/apikeys', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.key) {
        setNewKey(data.key);
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to generate key', error);
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!confirm('Are you sure you want to delete this API key? Any scripts using it will fail.')) return;
    try {
      await fetch(`/api/user/apikeys/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchApiKeys();
    } catch (error) {
      console.error('Failed to delete key', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('API Key copied to clipboard!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (!user) return <div className="p-8 max-w-4xl mx-auto flex items-center justify-center h-64 text-slate-500">Loading profile...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <User className="w-8 h-8 text-indigo-500" />
          Developer Profile
        </h1>
        <p className="text-slate-500 mt-1">Manage your account, billing, and view earned badges.</p>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-md">
              {user.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500 mb-4">{user.email}</p>
            <div className="flex items-center gap-2 text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
              <Shield className="w-3 h-3" />
              Verified Developer
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-slate-500" />
              <h3 className="font-semibold text-slate-900">Billing & Credits</h3>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Available Credits</span>
                <span className="text-2xl font-bold text-slate-900">{user.credits}</span>
              </div>
              
              <div className="space-y-3 mt-2">
                <button 
                  onClick={() => handleCheckout('pay-as-you-go')}
                  disabled={isCheckingOut}
                  className="w-full bg-white border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-700 py-2.5 rounded-xl font-medium transition-colors text-sm flex items-center justify-between px-4 disabled:opacity-50"
                >
                  <span>25 Runs (Pay-as-you-go)</span>
                  <span className="font-bold">$5.00</span>
                </button>
                
                <button 
                  onClick={() => handleCheckout('pro')}
                  disabled={isCheckingOut}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm flex items-center justify-between px-4 disabled:opacity-50"
                >
                  <span>150 Runs (Pro Pack)</span>
                  <span className="font-bold">$20.00</span>
                </button>
              </div>
              
              <p className="text-xs text-center text-slate-400 mt-2">1 credit = 1 benchmark run</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {challenge && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl border border-indigo-400 shadow-sm p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-indigo-100" />
                <h3 className="text-xl font-bold">Seasonal Challenge: {challenge.season_name}</h3>
              </div>
              <p className="text-indigo-100 mb-4">{challenge.description}</p>
              <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <div>
                  <p className="text-sm text-indigo-200">Reward Badge</p>
                  <p className="font-bold flex items-center gap-2"><Award className="w-4 h-4 text-amber-300"/> {challenge.badge_name}</p>
                </div>
                <div>
                  {user.badges.includes(challenge.badge_name) ? (
                    <span className="bg-emerald-400/20 text-emerald-100 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Completed</span>
                  ) : (
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold">In Progress</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-3">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900">Earned Badges</h3>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {user.badges.map((badge: string, i: number) => (
                <div key={i} className="flex flex-col items-center gap-3 p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 text-center">{badge}</span>
                </div>
              ))}
              <div className="flex flex-col items-center justify-center gap-3 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Award className="w-6 h-6 opacity-50" />
                </div>
                <span className="text-sm font-medium text-center">More to earn...</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900">API Keys</h3>
              </div>
              <button 
                onClick={handleGenerateKey}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Generate Key
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500">Use these keys to authenticate your CLI scripts or CI/CD pipelines.</p>
              
              {newKey && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <p className="text-sm font-medium text-amber-800">Please copy your new API key now. You won't be able to see it again!</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border border-amber-200 px-3 py-2 rounded-lg text-sm font-mono text-slate-800 break-all">{newKey}</code>
                    <button onClick={() => copyToClipboard(newKey)} className="p-2 bg-white border border-amber-200 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div key={key.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                        <Key className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-mono text-slate-900">ab_••••••••••••</p>
                        <p className="text-xs text-slate-500">Created {new Date(key.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteKey(key.id)}
                      className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {apiKeys.length === 0 && !newKey && (
                  <div className="text-center py-4 text-sm text-slate-500">
                    No API keys generated yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-3">
              <Settings className="w-5 h-5 text-slate-500" />
              <h3 className="text-lg font-bold text-slate-900">Account Settings</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">Email Notifications</p>
                  <p className="text-sm text-slate-500">Receive updates when your agent runs complete.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">Public Profile</p>
                  <p className="text-sm text-slate-500">Allow others to see your badges and top scores.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <div className="pt-4">
                <button className="flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium transition-colors">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
