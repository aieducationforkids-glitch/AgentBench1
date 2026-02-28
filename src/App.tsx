/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Trophy, Upload, List, User, Activity, LogOut, ShieldAlert, FilePlus } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Leaderboards from './pages/Leaderboards';
import SubmitAgent from './pages/SubmitAgent';
import Submissions from './pages/Submissions';
import SubmissionDetails from './pages/SubmissionDetails';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ProposeBenchmark from './pages/ProposeBenchmark';

function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/leaderboards', label: 'Leaderboards', icon: Trophy },
    { path: '/submit', label: 'Submit Agent', icon: Upload },
    { path: '/submissions', label: 'My Submissions', icon: List },
    { path: '/benchmarks/propose', label: 'Propose Benchmark', icon: FilePlus },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin Panel', icon: ShieldAlert });
  }

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen font-sans border-r border-slate-800">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <Activity className="w-8 h-8 text-emerald-400" />
        <span className="text-xl font-bold tracking-tight">AgentBench</span>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-emerald-500/10 text-emerald-400 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        {user && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-200">{user.name}</span>
                <span className="text-xs text-slate-400">{user.email}</span>
              </div>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-rose-400 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AppLayout() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/submit" element={<SubmitAgent />} />
          <Route path="/submissions" element={<Submissions />} />
          <Route path="/submissions/:id" element={<SubmissionDetails />} />
          <Route path="/benchmarks/propose" element={<ProposeBenchmark />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}
