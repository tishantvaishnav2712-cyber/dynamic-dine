import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, User, Mail, Lock, Phone, UserCheck } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await register(name, email, password, role, phone);
    if (res.success) {
      setTimeout(() => {
        navigate('/');
      }, 300);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian-900 px-4 py-8">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow effect decorative element */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-neoncyan rounded-full filter blur-[80px] opacity-25"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-neongreen rounded-full filter blur-[80px] opacity-25"></div>

        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-neoncyan/10 rounded-xl text-neoncyan mb-3">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">Register</h2>
          <p className="text-slate-400 mt-2 text-sm">Join the Dynamic Dine pricing terminal</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-5 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-obsidian-800/80 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neoncyan transition-all text-sm"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="w-4.5 h-4.5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-obsidian-800/80 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neoncyan transition-all text-sm"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Phone className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-obsidian-800/80 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neoncyan transition-all text-sm"
                placeholder="9876543210"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-4.5 h-4.5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-obsidian-800/80 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neoncyan transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Terminal Access Role
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <UserCheck className="w-4.5 h-4.5" />
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-obsidian-800/80 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neoncyan transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="customer" className="bg-obsidian-800 text-white">Customer Portal</option>
                <option value="waiter" className="bg-obsidian-800 text-white">Waiter Terminal</option>
                <option value="kitchen" className="bg-obsidian-800 text-white">Kitchen Display System</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-neongreen text-obsidian-900 font-bold py-3 rounded-xl hover:bg-neongreen/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-neongreen/15 mt-2 text-sm"
          >
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-neoncyan hover:underline font-medium">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
