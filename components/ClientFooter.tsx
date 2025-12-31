import React from 'react';
import { Icons } from './Icons';
import { User } from '../types';
import { useTranslation } from 'react-i18next';

interface ClientFooterProps {
  currentView: string;
  onChangeView: (view: 'book' | 'rides' | 'support' | 'settings') => void;
}

export const ClientFooter: React.FC<ClientFooterProps> = ({ currentView, onChangeView }) => {
  const { t } = useTranslation();
  
  const NavButton = ({ view, icon, label }: { view: 'book' | 'rides' | 'support' | 'settings', icon: React.ReactNode, label: string }) => {
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => onChangeView(view)}
        className={`flex flex-col items-center gap-1 p-2 transition-all duration-200 ${
          isActive 
            ? 'text-red-600 scale-105' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <div className={`${isActive ? 'stroke-2' : ''}`}>
           {icon}
        </div>
        <span className={`text-[10px] md:text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-safe pt-2 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <NavButton view="book" icon={<Icons.MapPin className="w-6 h-6" />} label={t('book')} />
        <NavButton view="rides" icon={<Icons.Route className="w-6 h-6" />} label={t('rides')} />
        <NavButton view="support" icon={<Icons.Headset className="w-6 h-6" />} label={t('support')} />
        <NavButton view="settings" icon={<Icons.Settings className="w-6 h-6" />} label={t('settings')} />
      </div>
    </div>
  );
};
