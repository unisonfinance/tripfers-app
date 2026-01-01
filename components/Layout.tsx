
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, MarketingBannerSettings, BrandingSettings } from '../types';
import { Icons } from './Icons';
import { MembershipModal } from './MembershipModal';
import { AuthModal } from './AuthModal';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';
import { backend } from '../services/BackendService';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, toggleTheme, isDark }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState<UserRole | null>(null);
  
  // Marketing Banner State
  const [marketingBanner, setMarketingBanner] = useState<MarketingBannerSettings | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);

  const { t, i18n } = useTranslation();

  const accountRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Fetch Marketing Settings
  useEffect(() => {
    backend.getMarketingSettings().then(setMarketingBanner).catch(console.error);
    backend.getBrandingSettings().then(setBranding).catch(console.error);
  }, []);

  // Enforce English for Admins (REMOVED: Allowing Admin to switch languages as requested)
  // useEffect(() => {
  //   if (user?.role === UserRole.ADMIN && i18n.language !== 'en') {
  //     i18n.changeLanguage('en');
  //   }
  // }, [user?.role, i18n.language]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const isClient = !user || user.role === UserRole.CLIENT;

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setShowLangDropdown(false);
  };

  const handleLogin = (newUser: User) => {
     window.location.reload(); 
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      
      {/* TOP NAVIGATION BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 md:px-6">
          
          {/* LEFT: Logo & Hamburger */}
          <div className="flex items-center gap-4">
             {/* Show Hamburger ONLY for ADMIN */}
             {user?.role === UserRole.ADMIN && (
                 <button 
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 md:hidden"
                 >
                    <Icons.Menu className="w-6 h-6" />
                 </button>
             )}

             <div className="flex items-center gap-2">
                {/* Logo Text */}
                {branding?.mainSiteLogoUrl ? (
                    <img 
                        src={branding.mainSiteLogoUrl} 
                        alt="Logo" 
                        className="h-8 w-auto md:hidden object-contain"
                        style={{
                            marginLeft: branding.logoMarginLeft ? `${branding.logoMarginLeft}px` : undefined,
                            marginTop: branding.logoMarginTop ? `${branding.logoMarginTop}px` : undefined,
                            marginBottom: branding.logoMarginBottom ? `${branding.logoMarginBottom}px` : undefined
                        }}
                    />
                ) : (
                    <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white md:hidden">TripFers</span>
                )}

                {user?.isMember && (
                    <span className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <Icons.Star className="w-3 h-3 fill-emerald-700 dark:fill-emerald-400 stroke-none" />
                        {t('vip')}
                    </span>
                 )}
             </div>
          </div>

          {/* RIGHT: Theme -> Language -> Account (Rightmost) */}
          <div className="flex items-center gap-1 md:gap-3">
             
             {/* 1. Theme Toggle */}
             <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 transition-colors"
                title={isDark ? t('light_mode') : t('dark_mode')}
             >
                {isDark ? <Icons.Sun className="w-6 h-6" /> : <Icons.Moon className="w-6 h-6" />}
             </button>

             {/* 2. Language Selector */}
             <div className="relative" ref={langRef}>
                <button 
                    onClick={() => setShowLangDropdown(!showLangDropdown)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 transition-colors"
                >
                    {LANGUAGES.find(l => l.code === i18n.language) ? (
                        <img 
                            src={`https://flagcdn.com/w40/${LANGUAGES.find(l => l.code === i18n.language)?.flag}.png`} 
                            alt="Language" 
                            className="w-6 h-6 object-cover rounded-full shadow-sm border border-slate-200 dark:border-slate-600" 
                        />
                    ) : (
                        <Icons.GlobeAlt className="w-6 h-6" />
                    )}
                </button>

                {showLangDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 animate-slide-up origin-top-right max-h-80 overflow-y-auto">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${i18n.language === lang.code ? 'bg-slate-50 dark:bg-slate-700 font-bold text-red-600' : 'text-slate-700 dark:text-slate-300'}`}
                            >
                                <img src={`https://flagcdn.com/w40/${lang.flag}.png`} alt={lang.name} className="w-6 h-auto shadow-sm rounded-[2px]" />
                                <span>{lang.name}</span>
                            </button>
                        ))}
                    </div>
                )}
             </div>

             {/* 3. Account Dropdown (RIGHTMOST) */}
             <div className="relative" ref={accountRef}>
                <button 
                    onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 transition-colors"
                >
                    <Icons.UserCircle className="w-7 h-7" />
                </button>
                
                {/* Dropdown Menu */}
                {showAccountDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 animate-slide-up origin-top-right overflow-hidden">
                        {user ? (
                            <>
                                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">{t('login_as')}</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.email}</p>
                                </div>
                                <button 
                                    onClick={onLogout}
                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-medium"
                                >
                                    <Icons.LogOut className="w-4 h-4" />
                                    {t('logout')}
                                </button>
                            </>
                        ) : (
                        <>
                          <button 
                              onClick={() => { setShowAccountDropdown(false); setAuthRole(null); setShowAuthModal(true); }}
                              className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
                          >
                              <Icons.User className="w-4 h-4" />
                              {t('log_in')}
                          </button>
                          <button 
                              onClick={() => { setShowAccountDropdown(false); setAuthRole(null); setShowAuthModal(true); }}
                              className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
                          >
                              <Icons.Plus className="w-4 h-4" />
                              {t('register')}
                          </button>
                        </>
                        )}
                    </div>
                )}
             </div>

          </div>
      </div>

      {/* Mobile CTA (Dynamic from Firestore) */}
      {isClient && !user?.isMember && marketingBanner?.isEnabled && (
         <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white dark:bg-slate-800 px-4 py-3 shadow-sm border-b border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setShowMembershipModal(true)} 
                className={`w-full font-bold py-2.5 rounded-lg shadow-sm text-sm flex items-center justify-center gap-2 transition-colors ${marketingBanner.backgroundColor || 'bg-emerald-600 hover:bg-emerald-700'}`}
                style={{ color: marketingBanner.textColor }}
              >
                 <Icons.Star className="w-4 h-4 stroke-none" style={{ fill: marketingBanner.textColor }} />
                 {marketingBanner.text || t('become_member')}
              </button>
         </div>
      )}


      {/* Sidebar (Admin Only) */}
      {user?.role === UserRole.ADMIN && (
        <aside className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 shadow-lg transform transition-transform duration-300 ease-in-out pt-20
            md:translate-x-0 md:fixed md:top-16 md:bottom-0 md:shadow-none border-r border-slate-200 dark:border-slate-700 overflow-y-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div className="p-4 flex flex-col h-full">
            <nav className="flex-1 space-y-2">
                <a href="#/admin" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
                    <Icons.Shield className="w-5 h-5" />
                    <span>{t('admin_panel')}</span>
                </a>
            </nav>
            </div>
        </aside>
      )}

      {/* Main Content - Add margin for fixed sidebar ONLY for Admin */}
      <main className={`flex-1 px-1 overflow-y-auto mt-16 
          ${user?.role === UserRole.ADMIN ? 'py-2 md:px-8 md:pb-8 md:pt-2 md:ml-64' : 'py-4 md:p-8'} 
          ${isClient && !user?.isMember && marketingBanner?.isEnabled ? 'pt-20 md:pt-8' : ''}
      `}>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Overlay for Mobile Sidebar (Admin Only) */}
      {user?.role === UserRole.ADMIN && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {showMembershipModal && user && (
          <MembershipModal onClose={() => setShowMembershipModal(false)} userId={user.id} onUpgrade={() => window.location.reload()} />
      )}

      {/* Auth Modal triggered from Layout Dropdown */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onLogin={handleLogin}
        initialRole={authRole}
      />
    </div>
  );
};
