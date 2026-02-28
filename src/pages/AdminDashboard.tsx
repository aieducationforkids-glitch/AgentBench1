import React, { useEffect, useState } from 'react';
import { ShieldAlert, Activity, Users, DollarSign, Database, AlertTriangle, CheckCircle2, Clock, XCircle, FilePlus, Check, X, Target, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [pendingBenchmarks, setPendingBenchmarks] = useState<any[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const [newChallenge, setNewChallenge] = useState({
    season_name: 'Summer 2026 Sprint',
    description: 'Achieve a score of 95+ with a cost under $0.20',
    badge_name: 'Summer \'26 Champion',
    target_score: 95.0,
    target_cost: 0.20
  });

  const fetchData = async () => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [statsRes, jobsRes, benchmarksRes, challengeRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/jobs', { headers }),
        fetch('/api/admin/benchmarks/pending', { headers }),
        fetch('/api/challenges', { headers })
      ]);
      
      if (statsRes.ok && jobsRes.ok && benchmarksRes.ok) {
        setStats(await statsRes.json());
        setJobs(await jobsRes.json());
        setPendingBenchmarks(await benchmarksRes.json());
        if (challengeRes.ok) setActiveChallenge(await challengeRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleFlagJob = async (id: number) => {
    if (!confirm('Are you sure you want to flag this job? This will halt execution and mark it as malicious.')) return;
    
    try {
      await fetch(`/api/admin/jobs/${id}/flag`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Failed to flag job", error);
    }
  };

  const handleBenchmarkAction = async (id: number, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this benchmark proposal?`)) return;
    
    try {
      await fetch(`/api/admin/benchmarks/${id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData(); // Refresh list
    } catch (error) {
      console.error(`Failed to ${action} benchmark`, error);
    }
  };

  const handleResetChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to end the current season and start a new one?')) return;
    
    setIsResetting(true);
    try {
      await fetch('/api/admin/challenges/reset', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newChallenge)
      });
      fetchData();
    } catch (error) {
      console.error("Failed to reset challenge", error);
    } finally {
      setIsResetting(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center h-64 text-slate-500">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  if (isLoading && !stats) {
    return <div className="p-8 max-w-7xl mx-auto flex items-center justify-center h-64 text-slate-500">Loading admin dashboard...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-indigo-600" />
          Admin Dashboard
        </h1>
        <p className="text-slate-500 mt-1">Platform monitoring, revenue tracking, and job moderation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900">${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Jobs</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.activeJobs || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Runs</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.totalSubmissions || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Users</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.totalUsers || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Seasonal Challenge Management
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-xl">
              <h3 className="text-sm font-bold text-purple-900 mb-1">Current Active Season</h3>
              {activeChallenge ? (
                <div>
                  <p className="text-lg font-medium text-purple-800">{activeChallenge.season_name}</p>
                  <p className="text-sm text-purple-600">{activeChallenge.description}</p>
                </div>
              ) : (
                <p className="text-sm text-purple-600">No active challenge.</p>
              )}
            </div>

            <form onSubmit={handleResetChallenge} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Start New Season</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Season Name</label>
                  <input type="text" required value={newChallenge.season_name} onChange={e => setNewChallenge({...newChallenge, season_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Badge Name</label>
                  <input type="text" required value={newChallenge.badge_name} onChange={e => setNewChallenge({...newChallenge, badge_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <input type="text" required value={newChallenge.description} onChange={e => setNewChallenge({...newChallenge, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Score (Min)</label>
                  <input type="number" step="0.1" required value={newChallenge.target_score} onChange={e => setNewChallenge({...newChallenge, target_score: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Cost (Max)</label>
                  <input type="number" step="0.01" required value={newChallenge.target_cost} onChange={e => setNewChallenge({...newChallenge, target_cost: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" />
                </div>
              </div>
              <button type="submit" disabled={isResetting} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                End Current & Start New Season
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-amber-500" />
              Pending Benchmark Proposals
            </h2>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">{pendingBenchmarks.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Proposal Details</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingBenchmarks.map((benchmark) => (
                  <tr key={benchmark.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{benchmark.name}</div>
                      <div className="text-xs text-slate-500 mb-1">{benchmark.industry} &rarr; {benchmark.subdomain}</div>
                      <div className="text-xs text-slate-400 italic">Proposed by: {benchmark.author_email || 'System'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleBenchmarkAction(benchmark.id, 'approve')}
                          className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 p-2 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleBenchmarkAction(benchmark.id, 'reject')}
                          className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingBenchmarks.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-slate-500">
                      No pending proposals.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Recent Evaluation Jobs
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">User / Agent</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.slice(0, 10).map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{job.agent_name} <span className="text-xs text-slate-400 font-normal">v{job.version}</span></div>
                    <div className="text-xs text-slate-500">{job.user_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                      job.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      job.status === 'Failed' ? 'bg-rose-100 text-rose-700' :
                      job.status === 'Flagged' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {job.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {job.status === 'Failed' && <XCircle className="w-3.5 h-3.5" />}
                      {job.status === 'Flagged' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {(job.status === 'Pending' || job.status === 'Running') && <Clock className="w-3.5 h-3.5" />}
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {job.status !== 'Flagged' && (
                      <button 
                        onClick={() => handleFlagJob(job.id)}
                        className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors flex items-center gap-1 ml-auto"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Flag
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    No jobs found in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
