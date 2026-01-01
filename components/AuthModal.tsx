import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { backend } from '../services/BackendService';
import { Icons } from './Icons';
import { useTranslation } from 'react-i18next';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  initialRole?: UserRole | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, initialRole }) => {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole || UserRole.CLIENT);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authStep, setAuthStep] = useState<'options' | 'email'>('options');
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (selectedRole === UserRole.ADMIN) {
            setFormData({
                email: '',
                password: '',
                name: ''
            });
        } else {
             setFormData({ email: '', password: '', name: '' });
        }
        setError(null);
        setAuthStep('options');
    }
  }, [isOpen, selectedRole]);

  // Secret admin access key listener
  useEffect(() => {
    if (!isOpen) return;
    const targetSequence = 'kittylee';
    let currentSequence = '';

    const keydownHandler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        currentSequence = '';
        return;
      }
      currentSequence += e.key.toLowerCase();
      if (!targetSequence.startsWith(currentSequence)) {
        currentSequence = e.key.toLowerCase() === targetSequence[0] ? e.key.toLowerCase() : '';
      }
      if (currentSequence === targetSequence) {
        setSelectedRole(UserRole.ADMIN);
        setAuthStep('email');
        currentSequence = '';
      }
    };
    window.addEventListener('keydown', keydownHandler);
    return () => window.removeEventListener('keydown', keydownHandler);
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await backend.loginWithGoogle(selectedRole);
      onLogin(user);
      onClose();
    } catch (e: any) {
       if (e.code === 'auth/unauthorized-domain') {
        setError(t('error_google_domain'));
      } else {
        setError(e.message || t('error_auth_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUp) {
        if (formData.password.length < 6) {
             setError(t('error_password_length'));
             setLoading(false);
             return;
        }
        if (selectedRole !== UserRole.ADMIN && formData.password !== confirmPassword) {
            setError(t('error_password_match'));
            setLoading(false);
            return;
        }
    }

    try {
      let user: User;
      if (isSignUp) {
        user = await backend.register(formData.email, formData.password, formData.name, selectedRole);
      } else {
        try {
            user = await backend.login(formData.email, formData.password, selectedRole, formData.name);
        } catch (loginError: any) {
             // If login fails, check if it's the admin and try to register/recover
             if (selectedRole === UserRole.ADMIN && formData.email === 'jclott77@gmail.com' && (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential')) {
                 user = await backend.register(formData.email, formData.password, 'Super Admin', UserRole.ADMIN);
             } else {
                 throw loginError;
             }
        }
      }
      onLogin(user);
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError(t('error_invalid_auth'));
      } else if (err.code === 'auth/email-already-in-use') {
        setError(t('error_email_in_use'));
      } else {
        setError(err.message || t('error_auth_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const AuthOptionButton = ({ icon, text, onClick, variant = 'white' }: { icon: any, text: any, onClick: any, variant?: 'white' | 'black' }) => (
     <button
        type="button"
        onClick={onClick}
        className={`w-full py-4 px-6 rounded-xl font-bold flex items-center gap-4 transition-all transform active:scale-[0.98] shadow-md hover:shadow-lg ${
          variant === 'black' 
            ? 'bg-black text-white hover:bg-slate-800' 
            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
        }`}
    >
        {icon}
        <span className="flex-1 text-left text-lg">{text}</span>
    </button>
  );

  if (!isOpen) return null;

  return (
     <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
       {/* ADMIN LOGIN */}
       {selectedRole === UserRole.ADMIN ? (
           <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up ring-1 ring-white/10 relative">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors z-10"><Icons.X className="w-5 h-5" /></button>

              <div className="p-8">
                 <div className="text-center mb-6">
                   <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">{t('admin_portal')}</h2>
                   <p className="text-slate-500 dark:text-slate-400 text-sm">{t('secure_access')}</p>
                 </div>
                 
                 {error && (
                   <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-r text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
                     <div className="mt-0.5"><Icons.Shield className="w-4 h-4" /></div>
                     <div>{error}</div>
                   </div>
                 )}

                 {authStep === 'options' ? (
                    <div className="space-y-4">
                        <AuthOptionButton variant="white" text={t('continue_email')} icon={<Icons.Mail className="w-6 h-6"/>} onClick={() => setAuthStep('email')} />
                        <AuthOptionButton variant="black" text={t('continue_google')} icon={<Icons.Google className="w-6 h-6"/>} onClick={handleGoogleLogin} />
                    </div>
                ) : (
                 <form onSubmit={handleSubmit} className="space-y-4">
                   <div className="space-y-1">
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('email_address')}</label>
                     <div className="relative">
                        <Icons.Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input required type="email" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium" placeholder="jclott77@gmail.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                     </div>
                   </div>
                   <div className="space-y-1">
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('password')}</label>
                     <div className="relative">
                        <Icons.Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input required type={showPassword ? "text" : "password"} className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium" placeholder="Corina77&&" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                        </button>
                     </div>
                   </div>
                   <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-white text-lg shadow-lg shadow-red-500/20 bg-red-600 hover:bg-red-700 mt-2">
                     {loading ? t('processing') : t('sign_in')}
                   </button>
                   <button type="button" onClick={() => setAuthStep('options')} className="w-full text-center text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium flex items-center justify-center gap-1 mt-2">
                        <Icons.ArrowLeft className="w-4 h-4" /> {t('back')}
                   </button>
                   {/* Sign Up removed for Admin to enforce single account */}
                 </form>
                )}
              </div>
           </div>
       ) : (
           /* CLIENT & DRIVER LOGIN */
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up relative border border-slate-200 dark:border-slate-700">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors z-20"><Icons.X className="w-5 h-5"/></button>
                
                <div className="p-8 flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/20 transform rotate-3">
                         <span className="text-white font-black text-2xl tracking-tighter">UT</span>
                    </div>
                    
                    <h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight mb-1">{t('client_driver_portal')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 text-center">Login to access your dashboard</p>
                    
                    {error && (
                       <div className="w-full mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                         <Icons.Shield className="w-4 h-4 shrink-0" />
                         <span>{error}</span>
                       </div>
                    )}

                    {/* Tabs */}
                    <div className="grid grid-cols-2 w-full bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                        <button 
                            onClick={() => setSelectedRole(UserRole.CLIENT)} 
                            className={`text-xs font-bold py-2.5 rounded-lg transition-all duration-200 ${selectedRole === UserRole.CLIENT ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {t('client').toUpperCase()}
                        </button>
                        <button 
                            onClick={() => setSelectedRole(UserRole.DRIVER)} 
                            className={`text-xs font-bold py-2.5 rounded-lg transition-all duration-200 ${selectedRole === UserRole.DRIVER ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {t('driver').toUpperCase()}
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                         {isSignUp && (
                            <div className="space-y-1 animate-fade-in">
                                <label className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider ml-1">{t('full_name')}</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors">
                                        <Icons.User className="w-5 h-5" />
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all text-sm font-medium"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            </div>
                         )}

                         <div className="space-y-1">
                            <label className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider ml-1 flex items-center gap-1">{t('email_address')} <span className="text-red-500">*</span></label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors">
                                    <Icons.Mail className="w-5 h-5" />
                                </div>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all text-sm font-medium"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                         </div>

                         <div className="space-y-1">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t('password')}</label>
                                {!isSignUp && <button type="button" className="text-red-600 text-[10px] font-bold hover:underline">{t('forgot_password')}</button>}
                            </div>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors">
                                    <Icons.Lock className="w-5 h-5" />
                                </div>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all text-sm font-medium font-sans"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    {showPassword ? <Icons.EyeOff className="w-4 h-4"/> : <Icons.Eye className="w-4 h-4"/>}
                                 </button>
                            </div>
                         </div>

                         {isSignUp && (
                            <div className="space-y-1 animate-fade-in">
                                <label className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider ml-1">{t('confirm_password')}</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors">
                                        <Icons.Lock className="w-5 h-5" />
                                    </div>
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all text-sm font-medium font-sans"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                         )}

                         <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/20 transition-all mt-4 uppercase tracking-wide text-xs transform active:scale-[0.98]">
                            {loading ? t('processing') : (isSignUp ? t('sign_up') : t('sign_in'))}
                         </button>

                         <div className="relative py-2 my-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 font-medium">{t('or_continue_with')}</span>
                            </div>
                         </div>

                         <button type="button" onClick={handleGoogleLogin} className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-wide shadow-sm hover:shadow-md">
                            <Icons.Google className="w-4 h-4" /> {t('sign_in_google')}
                         </button>

                         <div className="text-center pt-4 pb-2">
                            <span className="text-slate-500 dark:text-slate-400 text-xs">{isSignUp ? t('already_account') + ' ' : t('dont_have_account') + ' '}</span>
                            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-red-600 font-bold text-xs hover:underline uppercase">
                                {isSignUp ? t('log_in') : t('sign_up')}
                            </button>
                         </div>
                    </form>
                </div>
           </div>
       )}
     </div>
  );
};
