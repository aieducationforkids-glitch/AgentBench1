import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Code, Github, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SubmitAgent() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState('');
  const [agentName, setAgentName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [submissionType, setSubmissionType] = useState('docker');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/benchmarks').then(res => res.json()).then(setBenchmarks);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          benchmark_id: selectedBenchmark,
          agent_name: agentName,
          source_url: sourceUrl,
          type: submissionType
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }

      const data = await res.json();
      navigate('/submissions');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Upload className="w-8 h-8 text-indigo-500" />
          Submit Agent
        </h1>
        <p className="text-slate-500 mt-1">Upload your agent container or code repository for automated evaluation.</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Submission Details</h2>
          <p className="text-sm text-slate-500">Provide the necessary information to evaluate your agent.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Benchmark</label>
              <select 
                required
                value={selectedBenchmark}
                onChange={(e) => setSelectedBenchmark(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
              >
                <option value="" disabled>Select a benchmark...</option>
                {benchmarks.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.industry} - {b.subdomain}: {b.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Select the specific industry and task your agent is designed for.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Agent Name</label>
              <input 
                type="text" 
                required
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g., ClaimProcessor-v1.2"
                className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Submission Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors ${submissionType === 'docker' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                  <input type="radio" name="type" value="docker" className="sr-only" checked={submissionType === 'docker'} onChange={() => setSubmissionType('docker')} />
                  <Server className="w-6 h-6" />
                  <span className="font-medium text-sm">Docker Image</span>
                </label>
                <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors ${submissionType === 'github' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                  <input type="radio" name="type" value="github" className="sr-only" checked={submissionType === 'github'} onChange={() => setSubmissionType('github')} />
                  <Github className="w-6 h-6" />
                  <span className="font-medium text-sm">GitHub Repo</span>
                </label>
                <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors ${submissionType === 'zip' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                  <input type="radio" name="type" value="zip" className="sr-only" checked={submissionType === 'zip'} onChange={() => setSubmissionType('zip')} />
                  <Code className="w-6 h-6" />
                  <span className="font-medium text-sm">ZIP Upload</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {submissionType === 'docker' ? 'Image URI' : submissionType === 'github' ? 'Repository URL' : 'File URL'}
              </label>
              <input 
                type="text" 
                required
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder={submissionType === 'docker' ? 'docker.io/username/agent:latest' : 'https://github.com/username/agent'}
                className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5" 
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              This run will cost <strong>1 credit</strong>.
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for Evaluation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
