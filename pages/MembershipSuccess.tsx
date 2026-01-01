import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { backend } from '../services/BackendService';
import { Icons } from '../components/Icons';
import { User } from '../types';

export const MembershipSuccess: React.FC<{ user: User | null }> = ({ user }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (user && sessionId) {
            // Confirm membership with the backend (updates DB, sends email)
            backend.confirmMembership(user.id, sessionId)
                .then(() => {
                    setLoading(false);
                    // Force a small reload delay to ensure app state syncs if needed, 
                    // though for SPA we typically just update state. 
                    // user.isMember will be true on next fetch/render if handled in App.
                })
                .catch(err => {
                    console.error("Membership confirmation failed", err);
                    setLoading(false);
                });
        } else if (user?.isMember) {
             // User is already a member returning to this page
             setLoading(false);
        } else {
             // No session or user, redirect to home
             // setTimeout(() => navigate('/'), 3000);
             setLoading(false);
        }
    }, [user, searchParams, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full"></div>
                    <p className="text-slate-500 font-medium">Finalizing your membership...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center p-8 md:p-12 animate-fade-in">
                
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Icons.Check className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                </div>

                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
                    You're a Priority Member!
                </h1>
                
                <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
                    Thank you for joining. You now receive faster responses and priority driver matching.
                </p>

                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 mb-8 text-left space-y-4">
                    <div className="flex items-center gap-3">
                         <Icons.Star className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                         <span className="font-bold text-slate-800 dark:text-slate-200">Faster Driver Responses</span>
                    </div>
                     <div className="flex items-center gap-3">
                         <Icons.Shield className="w-5 h-5 text-emerald-500" />
                         <span className="font-bold text-slate-800 dark:text-slate-200">Premium Support</span>
                    </div>
                     <div className="flex items-center gap-3">
                         <Icons.Car className="w-5 h-5 text-emerald-500" />
                         <span className="font-bold text-slate-800 dark:text-slate-200">Priority Matching</span>
                    </div>
                </div>

                <button 
                    onClick={() => {
                        window.location.href = '/#/dashboard/client';
                        window.location.reload(); // Reload to ensure global state (badges) update immediately
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                    Go to Dashboard
                </button>

                <p className="mt-6 text-sm text-slate-400">
                    A receipt has been sent to your email.
                </p>

            </div>
        </div>
    );
};