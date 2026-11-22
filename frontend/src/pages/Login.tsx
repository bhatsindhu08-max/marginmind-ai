import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Lock, Mail, Building, ArrowRight, UserCheck, Sparkles, Building2 } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industryType, setIndustryType] = useState('metal_steel');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await register({
          email,
          password,
          full_name: fullName,
          business_name: businessName,
          industry_type: industryType,
          role: 'business_owner',
        });
      } else {
        await login(email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-7 glass-panel-elevated p-8 rounded-2xl shadow-2xl hairline-top-cyan relative z-10 border border-slate-800">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold font-mono text-2xl mx-auto shadow-glow-cyan">
            M
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight font-sans">
            {isRegister ? 'Onboard Your Manufacturing Enterprise' : 'Sign in to MarginMind AI'}
          </h2>
          <p className="text-xs text-slate-400">
            Connected Financial Intelligence & Decision Preparation Platform
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="text-slate-300 font-mono uppercase text-[11px] block mb-1">Company Legal Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Precision Components Pvt Ltd"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-slate-300 font-mono uppercase text-[11px] block mb-1">Target Manufacturing Industry</label>
                <select
                  value={industryType}
                  onChange={(e) => setIndustryType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-400 font-sans"
                >
                  <option value="metal_steel">Metal and Steel Manufacturing</option>
                  <option value="textile_garment">Textile & Garment Manufacturing</option>
                  <option value="electronics_assembly">Electronics Assembly & SMT</option>
                  <option value="food_processing">Food Processing & Packaging</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-mono uppercase text-[11px] block mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rajeshwar Patil"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-slate-300 font-mono uppercase text-[11px] block mb-1">Corporate Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@apexforge.com"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-slate-300 font-mono uppercase text-[11px] block mb-1">Secure Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-bold rounded-xl shadow-glow-cyan transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Complete Onboarding' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-slate-400 hover:text-cyan-400 transition"
          >
            {isRegister ? 'Already registered? Sign In' : 'New enterprise? Register onboarding profile'}
          </button>
        </div>

        {/* Quick Demo Login Shortcuts */}
        {!isRegister && (
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block text-center font-bold">
              1-Click Demo Profiles (4 Manufacturing Verticals)
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* Metal & Steel */}
              <button
                type="button"
                onClick={() => handleDemoLogin('owner@apexforge.com')}
                className="p-2.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 text-left transition group hover:shadow-sm"
              >
                <div className="font-bold text-slate-100 flex items-center justify-between">
                  <span>Apex Forging</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">Pune</span>
                </div>
                <div className="text-[10px] text-cyan-400 mt-0.5">Metal & Steel Mfg</div>
                <div className="text-[9px] text-slate-500 font-mono truncate">owner@apexforge.com</div>
              </button>

              {/* Textile & Garments */}
              <button
                type="button"
                onClick={() => handleDemoLogin('owner@vardhmantextiles.com')}
                className="p-2.5 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-800/40 hover:border-emerald-700/60 rounded-xl text-slate-300 text-left transition group hover:shadow-sm"
              >
                <div className="font-bold text-emerald-300 flex items-center justify-between">
                  <span>Vardhman Tex</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300 font-mono">Ludhiana</span>
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Textile & Garment</div>
                <div className="text-[9px] text-emerald-500 font-mono truncate">owner@vardhmantextiles.com</div>
              </button>

              {/* Electronics Assembly */}
              <button
                type="button"
                onClick={() => handleDemoLogin('owner@sahasraelectronics.com')}
                className="p-2.5 bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-800/40 hover:border-cyan-700/60 rounded-xl text-slate-300 text-left transition group hover:shadow-sm"
              >
                <div className="font-bold text-cyan-300 flex items-center justify-between">
                  <span>Sahasra Elec</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 font-mono">BLR</span>
                </div>
                <div className="text-[10px] text-cyan-400 mt-0.5">Electronics & SMT</div>
                <div className="text-[9px] text-cyan-500 font-mono truncate">owner@sahasraelectronics.com</div>
              </button>

              {/* Food Processing */}
              <button
                type="button"
                onClick={() => handleDemoLogin('owner@naturefreshfoods.com')}
                className="p-2.5 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-800/40 hover:border-amber-700/60 rounded-xl text-slate-300 text-left transition group hover:shadow-sm"
              >
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span>NatureFresh</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300 font-mono">Nashik</span>
                </div>
                <div className="text-[10px] text-amber-400 mt-0.5">Food Processing</div>
                <div className="text-[9px] text-amber-500 font-mono truncate">owner@naturefreshfoods.com</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
