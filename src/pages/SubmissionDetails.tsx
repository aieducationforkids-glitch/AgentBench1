import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, XCircle, FileText, Terminal, Activity, Server, Code, History, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SubmissionDetails() {
  const { token } = useAuth();
  const { id } = useParams();
  const [submission, setSubmission] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/submissions/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setSubmission(data);
        setIsLoading(false);
      });
  }, [id, token]);

  if (isLoading) {
    return <div className="p-8 max-w-7xl mx-auto flex items-center justify-center h-64 text-slate-500">Loading report...</div>;
  }

  if (!submission) {
    return <div className="p-8 max-w-7xl mx-auto flex items-center justify-center h-64 text-rose-500">Submission not found.</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/submissions" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            {submission.agent_name}
            <span className="text-sm font-medium bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg border border-slate-200">
              v{submission.version || 1}
            </span>
          </h1>
          <p className="text-slate-500 mt-1">Evaluation Report for {submission.benchmark_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-500">Status</p>
          <div className="flex items-center gap-2">
            {submission.status === 'Completed' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            ) : submission.status === 'Failed' ? (
              <XCircle className="w-6 h-6 text-rose-500" />
            ) : (
              <Clock className="w-6 h-6 text-amber-500" />
            )}
            <span className={`text-xl font-bold ${
              submission.status === 'Completed' ? 'text-emerald-700' :
              submission.status === 'Failed' ? 'text-rose-700' :
              'text-amber-700'
            }`}>
              {submission.status}
            </span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-500">Final Score</p>
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-500" />
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {submission.score ? submission.score.toFixed(2) : 'N/A'}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-500">Execution Cost</p>
          <div className="flex items-center gap-2">
            <Server className="w-6 h-6 text-slate-400" />
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {submission.cost ? `$${submission.cost.toFixed(2)}` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-3">
          <Terminal className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-bold text-slate-900">Execution Logs & Trace</h2>
        </div>
        <div className="p-6 bg-slate-900 text-slate-300 font-mono text-sm leading-relaxed overflow-x-auto">
          <pre className="whitespace-pre-wrap">
            {submission.logs || 'No logs available.'}
          </pre>
        </div>
      </div>

      {submission.status === 'Completed' && submission.feedback_json && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-emerald-50/50 flex items-center gap-3">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-emerald-900">Detailed Feedback Report</h2>
          </div>
          <div className="p-6 text-slate-700 leading-relaxed space-y-6">
            {(() => {
              try {
                const feedback = JSON.parse(submission.feedback_json);
                return (
                  <>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">LLM Judge Summary</h3>
                      <p>{feedback.llm_judge_summary}</p>
                    </div>
                    
                    {feedback.error_categories && feedback.error_categories.length > 0 && (
                      <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                        <h3 className="font-semibold text-rose-900 mb-2">Error Categories Detected:</h3>
                        <ul className="list-disc list-inside space-y-1 text-rose-700">
                          {feedback.error_categories.map((err: string, i: number) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feedback.per_task_results && feedback.per_task_results.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-3">Task-Level Results</h3>
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                              <tr>
                                <th className="px-4 py-3 font-medium">Task Description</th>
                                <th className="px-4 py-3 font-medium w-32">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {feedback.per_task_results.map((task: any, i: number) => (
                                <tr key={i}>
                                  <td className="px-4 py-3 text-slate-700">{task.task}</td>
                                  <td className="px-4 py-3">
                                    {task.status === 'Pass' ? (
                                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md text-xs">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded-md text-xs">
                                        <XCircle className="w-3.5 h-3.5" /> Fail
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {feedback.trace && feedback.trace.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-3">Execution Trace</h3>
                        <div className="space-y-2">
                          {feedback.trace.map((step: string, i: number) => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-medium text-slate-500">
                                {i + 1}
                              </div>
                              <span className="text-slate-600 font-mono">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              } catch (e) {
                return <p>Error parsing feedback data.</p>;
              }
            })()}
          </div>
        </div>
      )}

      {submission.history && submission.history.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center gap-3">
            <History className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-900">Version History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Version</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Score</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submission.history.map((hist: any) => (
                  <tr key={hist.id} className={`hover:bg-slate-50 transition-colors ${hist.id === submission.id ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      v{hist.version} {hist.id === submission.id && <span className="text-xs text-indigo-600 font-normal ml-2">(Current)</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                        hist.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        hist.status === 'Failed' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {hist.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {hist.score ? hist.score.toFixed(2) : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(hist.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {hist.id !== submission.id && (
                        <Link 
                          to={`/submissions/${hist.id}`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center justify-end gap-1"
                        >
                          View <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
