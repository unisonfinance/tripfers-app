import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Icons } from '../Icons';
import { backend } from '../../services/BackendService';
import { ConfirmationModal } from '../ConfirmationModal';
import { useTranslation } from 'react-i18next';

interface PayoutsViewProps {
  currentUser: User;
  onUpdate: (data: Partial<User>, noExit?: boolean) => void;
  onBack: () => void;
  setHasUnsavedChanges?: (hasChanges: boolean) => void;
}

export const PayoutsView: React.FC<PayoutsViewProps> = ({ currentUser, onUpdate, onBack, setHasUnsavedChanges }) => {
  const { t } = useTranslation();
  const [billingPeriod, setBillingPeriod] = useState('3 days');
  const [financeEmail, setFinanceEmail] = useState('finance@tripfers.com');
  
  // Local state for form
  const [localPaypalEmail, setLocalPaypalEmail] = useState(currentUser.paypalEmail || '');
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
      const loadSettings = async () => {
          if (backend.getSupportSettings) {
              const settings = await backend.getSupportSettings();
              if (settings && settings.financeEmail) {
                  setFinanceEmail(settings.financeEmail);
              }
          }
      };
      loadSettings();
  }, []);

  // Sync local state if prop changes (and not dirty)
  useEffect(() => {
      if (!isDirty && currentUser.paypalEmail) {
          setLocalPaypalEmail(currentUser.paypalEmail);
      }
  }, [currentUser.paypalEmail, isDirty]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalPaypalEmail(e.target.value);
      setIsDirty(true);
      if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  const handleSave = () => {
      onUpdate({ paypalEmail: localPaypalEmail }, true);
      setIsDirty(false);
      if (setHasUnsavedChanges) setHasUnsavedChanges(false);
      
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleBack = () => {
      if (isDirty) {
          setShowUnsavedModal(true);
      } else {
          onBack();
      }
  };

  const confirmDiscard = () => {
      setShowUnsavedModal(false);
      setIsDirty(false);
      if (setHasUnsavedChanges) setHasUnsavedChanges(false);
      onBack();
  };
  
  // Calculate status badge
  const renderStatusBadge = () => {
    const status = currentUser.paymentVerificationStatus || 'NONE';
    
    if (status === 'APPROVED') {
        return (
            <span className="flex items-center gap-1.5 text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg text-sm">
                <Icons.Check className="w-4 h-4" /> {t('status_approved')}
            </span>
        );
    }
    
    if (status === 'PENDING') {
        return (
            <span className="flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg text-sm">
                <Icons.Clock className="w-4 h-4" /> {t('status_verifying')}
            </span>
        );
    }

    if (status === 'REJECTED') {
         return (
            <span className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg text-sm">
                <Icons.X className="w-4 h-4" /> {t('status_rejected')}
            </span>
        );
    }

    return (
        <span className="flex items-center gap-1.5 text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-sm">
            {t('not_set')}
        </span>
    );
  };

  return (
     <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-20 animate-fade-in">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 px-4 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 sticky top-0 z-10">
            <button onClick={handleBack} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                <Icons.ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('payment_details')}</h1>
        </div>

        <div className="p-4 space-y-6 max-w-lg mx-auto">
            
            {/* Stats Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-5">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{t('turnover_12_months')}</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {currentUser.totalEarnings ? `US$${currentUser.totalEarnings.toFixed(2)}` : 'US$0.00'}
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                             <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{t('rating')}</p>
                             <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {currentUser.rating ? currentUser.rating.toFixed(1) : '0.0'}
                                </span>
                                <Icons.Star className={`w-4 h-4 ${currentUser.rating ? 'text-amber-500 fill-current' : 'text-slate-300'}`} />
                             </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-700 mb-6" />

                    <div className="space-y-4">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t('commission')}</h3>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400">{t('current_commission')}</span>
                                <span className="font-bold text-slate-900 dark:text-white">29.5%</span>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t('special_commission')}</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1">
                                        <span className="text-slate-500 dark:text-slate-400">{t('urgent')}</span>
                                        <Icons.HelpCircle className="w-4 h-4 text-slate-300" />
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white">5%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400">{t('delivery')}</span>
                                    <span className="font-bold text-slate-900 dark:text-white">10%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-700">
                    <button className="text-slate-900 dark:text-white font-bold text-sm underline decoration-slate-300 underline-offset-4">{t('calculation_rules')}</button>
                </div>
            </div>

            {/* Billing Period */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('current_billing_period')}</label>
                <div className="relative">
                    <select 
                        value={billingPeriod}
                        onChange={(e) => setBillingPeriod(e.target.value)}
                        className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pr-10 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                    >
                        <option>3 days</option>
                        <option>7 days</option>
                        <option>14 days</option>
                        <option>30 days</option>
                    </select>
                    <Icons.ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-xs text-slate-400 mt-2">{t('payment_period_hint')}</p>
            </div>

            {/* Bank Details */}
            <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">{t('bank_details')}</h3>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">{t('verification_status')}</span>
                        {renderStatusBadge()}
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">{t('outpayment_currency')}</span>
                        <span className="font-bold text-slate-900 dark:text-white">AUD</span>
                    </div>
                </div>
            </div>

            {/* PayPal */}
            <div>
                 <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">{t('paypal_email_label')}</h3>
                 <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 flex items-center">
                    <input 
                        type="email" 
                        value={localPaypalEmail} 
                        onChange={handleEmailChange}
                        className="w-full bg-transparent p-4 font-normal text-slate-900 dark:text-white outline-none placeholder:text-slate-300"
                        placeholder={t('enter_paypal_email')}
                    />
                 </div>
                 <p className="text-xs text-slate-400 mt-2 ml-1">
                    {t('paypal_change_hint')}
                 </p>
            </div>

            {/* Save Button - Always visible but disabled if no changes */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-50">
                <button 
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`w-full font-bold py-4 rounded-xl shadow-lg transition-colors uppercase tracking-wide text-sm ${
                        isDirty 
                            ? 'bg-black text-white hover:bg-slate-800 cursor-pointer' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    {isDirty ? t('save_details') : t('no_changes')}
                </button>
            </div>

            {/* Spacer for fixed button */}
            <div className="h-24"></div>

             {/* Footer Info */}
             <div className="text-center pt-8 pb-8">
                <p className="font-bold text-slate-900 dark:text-white mb-4">{t('receive_payments_via')}</p>
                <div className="flex justify-center mb-8">
                    <Icons.PayPal className="h-8 w-auto text-[#003087]" /> 
                </div>

                <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                    {t('contact_finance_hint')} <a href={`mailto:${financeEmail}`} className="text-slate-900 dark:text-white font-bold underline">{financeEmail}</a>
                </p>
             </div>

            {/* Unsaved Changes Modal */}
            {showUnsavedModal && (
                <ConfirmationModal
                    title={t('unsaved_changes_title')}
                    message={t('unsaved_changes_message')}
                    confirmText={t('discard_changes')}
                    cancelText={t('keep_editing')}
                    onConfirm={confirmDiscard}
                    onCancel={() => setShowUnsavedModal(false)}
                />
            )}

            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] animate-fade-in">
                    <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm cursor-pointer" onClick={() => setShowSuccessToast(false)}>
                        <Icons.Check className="w-5 h-5" />
                        {t('everything_saved')}
                    </div>
                </div>
            )}
        </div>
     </div>
  );
};
