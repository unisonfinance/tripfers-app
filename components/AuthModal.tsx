
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { mockBackend } from '../services/mockBackend';
import { Icons } from './Icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  initialRole?: UserRole | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, initialRole }) => {
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
                email: 'jclott77@gmail.com',
                password: 'Corina77&&',
                name: 'Admin User'
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
      const user = await mockBackend.loginWithGoogle(selectedRole);
      onLogin(user);
      onClose();
    } catch (e: any) {
       if (e.code === 'auth/unauthorized-domain') {
        setError("This app is not authorized for Google Sign-In from this web address.");
      } else {
        setError(e.message || "Google login failed.");
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
             setError("Password must be at least 6 characters.");
             setLoading(false);
             return;
        }
        if (selectedRole !== UserRole.ADMIN && formData.password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }
    }

    try {
      let user: User;
      if (isSignUp) {
        user = await mockBackend.register(formData.email, formData.password, formData.name, selectedRole);
      } else {
        user = await mockBackend.login(formData.email, formData.password, selectedRole, formData.name);
      }
      onLogin(user);
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError("Invalid email or password.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This email is already in use.");
      } else {
        setError(err.message || "Authentication failed.");
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
                   <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Admin Portal</h2>
                   <p className="text-slate-500 dark:text-slate-400 text-sm">Secure access only</p>
                 </div>
                 
                 {error && (
                   <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-r text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
                     <div className="mt-0.5"><Icons.Shield className="w-4 h-4" /></div>
                     <div>{error}</div>
                   </div>
                 )}

                 {authStep === 'options' ? (
                    <div className="space-y-4">
                        <AuthOptionButton variant="white" text="Continue with Email" icon={<Icons.Mail className="w-6 h-6"/>} onClick={() => setAuthStep('email')} />
                        <AuthOptionButton variant="black" text="Continue with Google" icon={<Icons.Google className="w-6 h-6"/>} onClick={handleGoogleLogin} />
                    </div>
                ) : (
                 <form onSubmit={handleSubmit} className="space-y-4">
                   <div className="space-y-1">
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Email Address</label>
                     <div className="relative">
                        <Icons.Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input required type="email" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium" placeholder="name@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                     </div>
                   </div>
                   <div className="space-y-1">
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Password</label>
                     <div className="relative">
                        <Icons.Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input required type={showPassword ? "text" : "password"} className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                        </button>
                     </div>
                   </div>
                   <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-white text-lg shadow-lg shadow-red-500/20 bg-red-600 hover:bg-red-700 mt-2">
                     {loading ? 'Processing...' : 'Sign In'}
                   </button>
                   <button type="button" onClick={() => setAuthStep('options')} className="w-full text-center text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium flex items-center justify-center gap-1 mt-2">
                        <Icons.ArrowLeft className="w-4 h-4" /> Back
                   </button>
                 </form>
                )}
              </div>
           </div>
       ) : (
           /* CLIENT & DRIVER LOGIN */
           <div className="bg-[#151f32] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up relative border border-slate-700">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-20"><Icons.X className="w-5 h-5"/></button>
                
                <div className="p-8 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg overflow-hidden relative border-4 border-[#151f32] ring-1 ring-slate-700">
                         <div className="absolute inset-0 border-[3px] border-red-600 rounded-full m-1 opacity-80"></div>
                         <div className="relative z-10 flex flex-col items-center justify-center -mt-1">
                            <span className="text-red-700 font-black text-3xl tracking-tighter leading-none">UT</span>
                            <div className="w-8 h-1 bg-red-600 rounded-full mt-0.5"></div>
                         </div>
                    </div>
                    
                    <h2 className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-6">CLIENT & DRIVER PORTAL</h2>
                    
                    {error && (
                       <div className="w-full mb-4 p-3 bg-red-900/30 border border-red-900 rounded-lg text-red-400 text-xs flex items-start gap-2">
                         <Icons.Shield className="w-4 h-4 shrink-0" />
                         <span>{error}</span>
                       </div>
                    )}

                    {/* Tabs */}
                    <div className="grid grid-cols-2 w-full bg-[#0f172a] p-1 rounded-lg mb-2 border border-slate-700/50">
                        <button 
                            onClick={() => setSelectedRole(UserRole.CLIENT)} 
                            className={`text-xs font-bold py-2.5 rounded transition-all duration-200 ${selectedRole === UserRole.CLIENT ? 'bg-[#1e293b] text-white shadow-sm border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            CLIENT
                        </button>
                        <button 
                            onClick={() => setSelectedRole(UserRole.DRIVER)} 
                            className={`text-xs font-bold py-2.5 rounded transition-all duration-200 ${selectedRole === UserRole.DRIVER ? 'bg-[#1e293b] text-white shadow-sm border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            DRIVER
                        </button>
                    </div>
                    
                    <div className="flex justify-center mb-6 h-6">
                       {selectedRole === UserRole.CLIENT && (
                           <button 
                             type="button"
                             onClick={() => setFormData(prev => ({...prev, email: 'kittyleetrading@gmail.com', password: 'Corina77&&'}))}
                             className="text-[10px] text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-white px-3 py-1 rounded transition-colors uppercase tracking-wide"
                           >
                             Use Test Client Login
                           </button>
                       )}
                       {selectedRole === UserRole.DRIVER && (
                           <button 
                             type="button"
                             onClick={() => setFormData(prev => ({...prev, email: 'info@unisontransfers.com.au', password: 'Corina77&&'}))}
                             className="text-[10px] text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-white px-3 py-1 rounded transition-colors uppercase tracking-wide"
                           >
                             Use Test Driver Login
                           </button>
                       )}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                         {isSignUp && (
                            <div className="space-y-1 animate-fade-in">
                                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors">
                                        <Icons.User className="w-5 h-5" />
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-red-600 transition-colors text-sm"
                                        placeholder="Your Name"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            </div>
                         )}

                         <div className="space-y-1">
                            <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider ml-1 flex items-center gap-1">Email Address <span className="text-red-500">*</span></label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors">
                                    <Icons.Mail className="w-5 h-5" />
                                </div>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-red-600 transition-colors text-sm"
                                    placeholder={selectedRole === UserRole.CLIENT ? "kittyleetrading@gmail.com" : selectedRole === UserRole.DRIVER ? "info@unisontransfers.com.au" : ""}
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                         </div>

                         <div className="space-y-1">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Password</label>
                                {!isSignUp && <button type="button" className="text-red-500 text-[10px] font-bold hover:underline">Forgot password?</button>}
                            </div>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors">
                                    <Icons.Lock className="w-5 h-5" />
                                </div>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg py-3 pl-10 pr-10 text-white placeholder-slate-600 focus:outline-none focus:border-red-600 transition-colors text-sm font-sans"
                                    placeholder={!isSignUp ? "Corina77&&" : ""}
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                    {showPassword ? <Icons.EyeOff className="w-4 h-4"/> : <Icons.Eye className="w-4 h-4"/>}
                                 </button>
                            </div>
                         </div>

                         {isSignUp && (
                            <div className="space-y-1 animate-fade-in">
                                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors">
                                        <Icons.Lock className="w-5 h-5" />
                                    </div>
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg py-3 pl-10 pr-10 text-white placeholder-slate-600 focus:outline-none focus:border-red-600 transition-colors text-sm font-sans"
                                        placeholder=""
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                         )}

                         <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-red-900/20 transition-all mt-4 uppercase tracking-wide text-xs">
                            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                         </button>

                         <div className="relative py-2 my-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-700"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-[#151f32] text-slate-500 font-medium">Or continue with</span>
                            </div>
                         </div>

                         <button type="button" onClick={handleGoogleLogin} className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-xs uppercase tracking-wide shadow-sm">
                            <Icons.Google className="w-4 h-4" /> Sign in with Google
                         </button>

                         <div className="text-center pt-4 pb-2">
                            <span className="text-slate-400 text-xs">{isSignUp ? 'Already have an account? ' : "Don't have an account? "}</span>
                            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-red-500 font-bold text-xs hover:underline uppercase">
                                {isSignUp ? 'Log in' : 'Sign up'}
                            </button>
                         </div>
                    </form>
                </div>
           </div>
       )}
     </div>
  );
};
