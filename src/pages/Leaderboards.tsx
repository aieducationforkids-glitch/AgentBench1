import { useEffect, useState } from 'react';
import { Trophy, Filter, Search, ChevronDown, Award } from 'lucide-react';

export default function Leaderboards() {
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [leaderboards, setLeaderboards] = useState<any[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedSubdomain, setSelectedSubdomain] = useState<string>('');

  useEffect(() => {
    fetch('/api/benchmarks').then(res => res.json()).then(setBenchmarks);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedIndustry) params.append('industry', selectedIndustry);
    if (selectedSubdomain) params.append('subdomain', selectedSubdomain);
    
    fetch(`/api/leaderboards?${params.toString()}`)
      .then(res => res.json())
      .then(setLeaderboards);
  }, [selectedIndustry, selectedSubdomain]);

  const industries = Array.from(new Set(benchmarks.map(b => b.industry)));
  const subdomains = Array.from(new Set(benchmarks.filter(b => !selectedIndustry || b.industry === selectedIndustry).map(b => b.subdomain)));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            Global Leaderboards
          </h1>
          <p className="text-slate-500 mt-1">Compare agent performance across industry-specific benchmarks.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-5 h-5 text-slate-400" />
            <select 
              className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
              value={selectedIndustry}
              onChange={(e) => { setSelectedIndustry(e.target.value); setSelectedSubdomain(''); }}
            >
              <option value="">All Industries</option>
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
            <select 
              className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
              value={selectedSubdomain}
              onChange={(e) => setSelectedSubdomain(e.target.value)}
              disabled={!selectedIndustry && subdomains.length === 0}
            >
              <option value="">All Subdomains</option>
              {subdomains.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input 
              type="text" 
              className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2.5" 
              placeholder="Search agents..." 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Rank</th>
                <th scope="col" className="px-6 py-4 font-semibold">Agent Name</th>
                <th scope="col" className="px-6 py-4 font-semibold">Developer</th>
                <th scope="col" className="px-6 py-4 font-semibold">Benchmark</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Score</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Cost/Run</th>
              </tr>
            </thead>
            <tbody>
              {leaderboards.map((entry, index) => (
                <tr key={entry.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Award className="w-5 h-5 text-amber-400" />}
                      {index === 1 && <Award className="w-5 h-5 text-slate-400" />}
                      {index === 2 && <Award className="w-5 h-5 text-amber-700" />}
                      <span className={index < 3 ? 'font-bold text-lg' : ''}>#{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-emerald-600">
                    {entry.agent_name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {entry.developer.charAt(0)}
                      </div>
                      {entry.developer}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200">
                      {entry.benchmark_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                    {entry.score.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-500">
                    ${entry.cost.toFixed(2)}
                  </td>
                </tr>
              ))}
              {leaderboards.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No agents found for the selected criteria. Be the first to submit!
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
