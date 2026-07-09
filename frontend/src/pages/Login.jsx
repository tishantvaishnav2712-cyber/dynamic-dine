import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      // Fetch user role from localStorage/context to redirect
      const token = localStorage.getItem('token');
      if (token) {
        // We'll read the user context in a moment
        // Fetch profile
        setTimeout(() => {
          const authUser = JSON.parse(localStorage.getItem('user') || '{}');
          const role = authUser.role || 'customer';
          // Check role and navigate
          if (email === 'admin@dynamicdine.com') {
            navigate('/admin');
          } else {
            // A safer profile-based check will resolve in App.jsx routing, 
            // but let's pre-redirect based on email or roles.
            navigate('/');
          }
        }, 300);
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian-900 px-4">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow effect decorative element */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-neoncyan rounded-full filter blur-[80px] opacity-25"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-neongreen rounded-full filter blur-[80px] opacity-25"></div>

        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-neoncyan/10 rounded-xl text-neoncyan mb-3">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Dynamic Dine</h2>
          <p className="text-slate-400 mt-2 text-sm">Stock Market-Based Dining & Pricing Terminal</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-5 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-obsidian-800/80 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-neoncyan transition-all text-sm"
                placeholder="Enter email (e.g. admin@dynamicdine.com)"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-obsidian-800/80 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-neoncyan transition-all text-sm"
                placeholder="Enter password (e.g. Admin@12345)"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-neoncyan text-obsidian-900 font-bold py-3.5 rounded-xl hover:bg-neoncyan/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-neoncyan/15 text-sm"
          >
            Connect Session
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          First time dining?{' '}
          <Link to="/register" className="text-neoncyan hover:underline font-medium">
            Register Terminal Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
