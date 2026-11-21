import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Lock, Mail, Building, ArrowRight, UserCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-2xl mx-auto shadow-sm">
            M
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            {isRegister ? 'Onboard Your Manufacturing Enterprise' : 'Sign in to MarginMind AI'}
          </h2>
          <p className="text-xs text-slate-400">
            Connected Financial Intelligence & Decision Preparation Platform
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Company Legal Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Precision Components Pvt Ltd"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Target Manufacturing Industry</label>
                <select
                  value={industryType}
                  onChange={(e) => setIndustryType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                >
                  <option value="metal_steel">Metal and Steel Manufacturing</option>
                  <option value="textile_garment">Textile & Garment Manufacturing</option>
                  <option value="electronics_assembly">Electronics Assembly & SMT</option>
                  <option value="food_processing">Food Processing & Packaging</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rajeshwar Patil"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-slate-300 font-medium block mb-1">Corporate Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@apexforge.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Secure Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Complete Onboarding' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-slate-400 hover:text-emerald-400 transition"
          >
            {isRegister ? 'Already registered? Sign In' : 'New enterprise? Register onboarding profile'}
          </button>
        </div>

        {/* Quick Demo Login Shortcuts */}
        {!isRegister && (
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block text-center">
              Demonstration Quick Access (Pre-Configured Metal Mfg)
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleDemoLogin('owner@apexforge.com')}
                className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-left transition"
              >
                <div className="font-semibold text-slate-100">Business Owner</div>
                <div className="text-[10px] text-emerald-400">Full Authority</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('finance@apexforge.com')}
                className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-left transition"
              >
                <div className="font-semibold text-slate-100">Finance Manager</div>
                <div className="text-[10px] text-cyan-400">Costing & Margins</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('procurement@apexforge.com')}
                className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-left transition"
              >
                <div className="font-semibold text-slate-100">Procurement</div>
                <div className="text-[10px] text-amber-400">Vendors & Sourcing</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('production@apexforge.com')}
                className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-left transition"
              >
                <div className="font-semibold text-slate-100">Production</div>
                <div className="text-[10px] text-purple-400">BOMs & Inventory</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
