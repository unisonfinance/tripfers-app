import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { backend } from '../services/BackendService';
import { Icons } from './Icons';
import { useTranslation } from 'react-i18next';

interface PartnerLoginProps {
  onLogin: (user: User) => void;
}

export const PartnerLogin: React.FC<PartnerLoginProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-fill for convenience if you want (Optional)
  // useEffect(() => {
  //    // Could load last used email from local storage
  // }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Force AGENCY role during login attempt verification
      const user = await backend.login(formData.email, formData.password, UserRole.AGENCY);
      
      // Double check role to be absolutely sure
      if (user.role !== UserRole.AGENCY) {
          throw new Error("Access Denied. This portal is for Partners only.");
      }
      
      onLogin(user);
    } catch (err: any) {
      console.error("Partner Login Error:", err);
      if (err.message.includes("Access Denied")) {
          setError("This account is not a registered Partner.");
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError(t('error_invalid_auth'));
      } else {
        setError(err.message || t('error_auth_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
            <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-[128px]"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-[128px]"></div>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-10 overflow-hidden">
            <div className="p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/20 transform rotate-3">
                        <Icons.Briefcase className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Partner Portal</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Secure access for agencies & hotels</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-r text-red-600 dark:text-red-400 text-xs flex items-start gap-3">
                        <Icons.Shield className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Work Email</label>
                        <div className="relative group">
                            <Icons.Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input 
                                required 
                                type="email" 
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium text-sm" 
                                placeholder="partner@company.com" 
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Password</label>
                        <div className="relative group">
                            <Icons.Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input 
                                required 
                                type={showPassword ? "text" : "password"} 
                                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium text-sm" 
                                placeholder="••••••••" 
                                value={formData.password} 
                                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full py-3.5 rounded-xl font-bold text-white text-sm uppercase tracking-wide shadow-lg shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Icons.RefreshCw className="w-4 h-4 animate-spin" /> Authenticating...
                            </>
                        ) : (
                            <>
                                Sign In to Dashboard <Icons.ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-400">
                        Don't have a partner account? <br/>
                        <a href="mailto:partners@tripfers.com" className="text-indigo-600 font-bold hover:underline">Contact our B2B Sales Team</a>
                    </p>
                </div>
            </div>
        </div>
        
        <div className="mt-8 text-center opacity-40 hover:opacity-100 transition-opacity">
            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Secured by Tripfers Infrastructure • <a href="https://tripfers.com" className="hover:underline">Main Site</a>
            </p>
        </div>
    </div>
  );
};
