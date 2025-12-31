import React from 'react';
import { User } from '../../types';
import { Icons } from '../../components/Icons';
import { useTranslation } from 'react-i18next';

interface SettingsViewProps {
  user: User | null;
  onLoginRequest: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onLoginRequest, onLogout }) => {
  const { t } = useTranslation();

  if (!user) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <Icons.Lock className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('login_required')}</h2>
        <p className="text-slate-500 mb-8">{t('login_manage_hint')}</p>
        <button 
          onClick={onLoginRequest}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-colors w-full"
        >
          {t('login_register')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-24 space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white px-2">{t('settings')}</h2>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
             <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                    {user.name.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{user.name}</h3>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    {user.isMember && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full mt-1 inline-block">{t('premium_member')}</span>}
                </div>
             </div>
             
             <div className="p-2">
                 <button className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors flex items-center justify-between group">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{t('profile_information')}</span>
                    <Icons.ArrowLeft className="w-5 h-5 rotate-180 text-slate-300 group-hover:text-slate-500" />
                 </button>
                 <button className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors flex items-center justify-between group">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{t('payment_methods')}</span>
                    <Icons.ArrowLeft className="w-5 h-5 rotate-180 text-slate-300 group-hover:text-slate-500" />
                 </button>
                 <button className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors flex items-center justify-between group">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{t('notifications')}</span>
                    <Icons.ArrowLeft className="w-5 h-5 rotate-180 text-slate-300 group-hover:text-slate-500" />
                 </button>
             </div>
        </div>

        <button 
            onClick={onLogout}
            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-red-600 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
            <Icons.LogOut className="w-5 h-5" />
            {t('logout')}
        </button>
    </div>
  );
};