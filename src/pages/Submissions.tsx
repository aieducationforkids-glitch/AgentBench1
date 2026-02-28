import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { List, CheckCircle2, Clock, XCircle, ArrowRight, RefreshCw, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Submissions() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubmissions = () => {
    if (!token) return;
    setIsLoading(true);
    fetch('/api/submissions', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setSubmissions(data);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!token) return;
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <List className="w-8 h-8 text-indigo-500" />
            My Submissions
          </h1>
          <p className="text-slate-500 mt-1">Track the status of your agent evaluations and view detailed reports.</p>
        </div>
        <button 
          onClick={fetchSubmissions}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Agent Name</th>
                <th scope="col" className="px-6 py-4 font-semibold">Benchmark</th>
                <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                <th scope="col" className="px-6 py-4 font-semibold">Score</th>
                <th scope="col" className="px-6 py-4 font-semibold">Cost</th>
                <th scope="col" className="px-6 py-4 font-semibold">Submitted</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                    {sub.agent_name} <span className="text-xs font-normal text-slate-500 ml-1">v{sub.version || 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200">
                      {sub.industry} - {sub.benchmark_name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {sub.status === 'Completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : sub.status === 'Failed' ? (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500" />
                      )}
                      <span className={`font-medium ${
                        sub.status === 'Completed' ? 'text-emerald-700' :
                        sub.status === 'Failed' ? 'text-rose-700' :
                        'text-amber-700'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">
                    {sub.score ? sub.score.toFixed(2) : '-'}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500">
                    {sub.cost ? `$${sub.cost.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(sub.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      to={`/submissions/${sub.id}`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-end gap-1"
                    >
                      View Report <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FileText className="w-12 h-12 text-slate-300" />
                      <p>You haven't submitted any agents yet.</p>
                      <Link to="/submit" className="text-indigo-600 hover:text-indigo-800 font-medium">
                        Submit your first agent
                      </Link>
                    </div>
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
