import React, { useState } from 'react';
import { backend } from '../services/BackendService';
import { Icons } from './Icons';
import { useTranslation } from 'react-i18next';

interface MembershipModalProps {
    onClose: () => void;
    userId: string;
    onUpgrade: () => void;
}

export const MembershipModal: React.FC<MembershipModalProps> = ({ onClose, userId, onUpgrade }) => {
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    const handlePayment = async () => {
        setLoading(true);
        try {
            // Initiate the simulated Stripe Checkout flow
            const redirectUrl = await backend.initiateStripeCheckout(userId);
            
            // Redirect the user to the success page (simulating Stripe callback)
            window.location.href = redirectUrl;
            
            // Note: In a real app with Stripe.js, we would use stripe.redirectToCheckout({ sessionId })
            // Here, backend provides a direct URL to our internal success page to handle the flow.
        } catch (error) {
            console.error("Payment initiation failed:", error);
            setLoading(false);
            alert("Unable to connect to payment gateway. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-200 dark:border-slate-700 animate-slide-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white z-10">
                    <Icons.X className="w-6 h-6" />
                </button>
                
                <div className="bg-gradient-to-r from-emerald-600 to-green-500 p-8 text-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Icons.Star className="w-8 h-8 fill-white stroke-none" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-wide mb-2">{t('priority_membership')}</h2>
                    <p className="text-white/90 font-medium">{t('unlock_power')}</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-green-100 dark:bg-green-900/40 p-1 rounded text-green-600 dark:text-green-400 mt-0.5">
                                <Icons.Check className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">{t('faster_responses')}</h4>
                                <p className="text-sm text-slate-500">Your requests appear at the top of driver lists.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-green-100 dark:bg-green-900/40 p-1 rounded text-green-600 dark:text-green-400 mt-0.5">
                                <Icons.Check className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">{t('premium_support')}</h4>
                                <p className="text-sm text-slate-500">24/7 dedicated support line access.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-green-100 dark:bg-green-900/40 p-1 rounded text-green-600 dark:text-green-400 mt-0.5">
                                <Icons.Check className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">{t('priority_matching')}</h4>
                                <p className="text-sm text-slate-500">Get matched with top-rated drivers instantly.</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-slate-500 font-medium">{t('total')}</span>
                            <span className="text-3xl font-bold text-slate-900 dark:text-white">$9.99 <span className="text-sm text-slate-400 font-normal">/ {t('month')}</span></span>
                        </div>
                        
                        <button 
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full bg-[#635bff] hover:bg-[#544de0] text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span>Processing...</span>
                            ) : (
                                <>
                                    <span>{t('pay_with')}</span>
                                    <span className="font-black italic">Stripe</span>
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-slate-400 mt-4">{t('secure_payment')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};