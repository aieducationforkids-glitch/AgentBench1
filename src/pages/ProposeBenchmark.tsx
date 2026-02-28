import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProposeBenchmark() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [industry, setIndustry] = useState('Healthcare');
  const [subdomain, setSubdomain] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/benchmarks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ industry, subdomain, name, description })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit proposal');
      }

      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 max-w-3xl mx-auto flex flex-col items-center justify-center h-96 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Proposal Submitted!</h2>
        <p className="text-slate-500 max-w-md">
          Thank you for contributing to AgentBench. Your benchmark proposal has been sent to the admin team for review. You will be redirected shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <FilePlus className="w-8 h-8 text-indigo-500" />
          Propose a Benchmark
        </h1>
        <p className="text-slate-500 mt-1">Submit a new domain-specific task for the community to evaluate agents against.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Industry</label>
            <select
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3"
            >
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Legal">Legal</option>
              <option value="Engineering">Engineering</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subdomain</label>
            <input
              type="text"
              required
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="e.g., Payer, Trading, Contracts"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Benchmark Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Claims Adjudication Agent"
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description & Evaluation Criteria</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe the task the agent must perform and how it will be evaluated..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 resize-none"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Submit Proposal
          </button>
        </div>
      </form>
    </div>
  );
}
