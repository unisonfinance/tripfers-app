import React, { useEffect, useState } from 'react';
import { Icons } from '../../components/Icons';
import { useTranslation } from 'react-i18next';
import { mockBackend } from '../../services/mockBackend';
import { SupportSettings } from '../../types';

export const SupportView: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SupportSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
        if (mockBackend.getSupportSettings) {
            const data = await mockBackend.getSupportSettings();
            setSettings(data);
        }
    };
    loadSettings();
    // Subscribe for real-time updates
    const unsubscribe = mockBackend.subscribe(loadSettings);
    return () => unsubscribe();
  }, []);

  // Format WhatsApp number for link (remove spaces, +, etc)
  const whatsappLink = settings?.whatsappNumber 
      ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}` 
      : '#';

  return (
    <div className="max-w-md mx-auto space-y-6 pb-24">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t('support_center')}</h2>
        
        <div className="space-y-4">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <div className="bg-green-500/10 p-3 rounded-full text-green-600">
               <Icons.MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{t('whatsapp_chat')}</p>
              <p className="text-xs text-slate-500">{t('fastest_response')}</p>
            </div>
          </a>

          <a href={`mailto:${settings?.supportEmail || 'support@gettransfer.com'}`} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <div className="bg-blue-500/10 p-3 rounded-full text-blue-600">
               <Icons.Mail className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{t('email_support')}</p>
              <p className="text-xs text-slate-500">{settings?.supportEmail || 'support@gettransfer.com'}</p>
            </div>
          </a>

          <a href={`tel:${settings?.supportPhone || '+18001234567'}`} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <div className="bg-red-500/10 p-3 rounded-full text-red-600">
               <Icons.Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{t('call_us')}</p>
              <p className="text-xs text-slate-500">{settings?.supportPhone || t('international_toll_free')}</p>
            </div>
          </a>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-slate-400 text-sm">{t('operating_hours')}</p>
        <p className="text-slate-500 text-xs mt-1">GetTransfer Ltd. London, UK</p>
      </div>
    </div>
  );
};
