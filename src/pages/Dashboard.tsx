import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Activity, Coins, ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

const mockChartData = [
  { name: 'Mon', score: 82 },
  { name: 'Tue', score: 85 },
  { name: 'Wed', score: 84 },
  { name: 'Thu', score: 89 },
  { name: 'Fri', score: 92 },
  { name: 'Sat', score: 91 },
  { name: 'Sun', score: 95 },
];

export default function Dashboard() {
  const { token } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    fetch('/api/user', { headers }).then(res => res.json()).then(setUser);
    fetch('/api/submissions', { headers }).then(res => res.json()).then(data => setRecentSubmissions(data.slice(0, 3)));
  }, [token]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back, {user?.name?.split(' ')[0] || 'Developer'}</h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your agents today.</p>
        </div>
        <Link to="/submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm">
          <Activity className="w-5 h-5" />
          Run New Benchmark
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Highest Score</p>
            <p className="text-2xl font-bold text-slate-900">92.5<span className="text-sm font-normal text-slate-400 ml-1">/ 100</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Runs</p>
            <p className="text-2xl font-bold text-slate-900">12</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Available Credits</p>
            <p className="text-2xl font-bold text-slate-900">{user?.credits || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Performance Trend</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recent Runs</h2>
            <Link to="/submissions" className="text-sm font-medium text-emerald-500 hover:text-emerald-600 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            {recentSubmissions.map((sub) => (
              <div key={sub.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                {sub.status === 'Completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                ) : sub.status === 'Failed' ? (
                  <XCircle className="w-5 h-5 text-rose-500 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{sub.agent_name}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{sub.benchmark_name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                      sub.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      sub.status === 'Failed' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {sub.status}
                    </span>
                    {sub.score && (
                      <span className="text-xs font-mono text-slate-600">Score: {sub.score}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {recentSubmissions.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
                No recent runs found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
