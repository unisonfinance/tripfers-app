import React, { useState, useEffect } from 'react';
import { User, Job } from '../types';
import { backend } from '../services/BackendService';
import { Icons } from '../components/Icons';
import { useTranslation } from 'react-i18next';

interface AgencyDashboardProps {
    user: User;
}

export const AgencyDashboard: React.FC<AgencyDashboardProps> = ({ user }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'developers' | 'settings'>('overview');
    const [apiKey, setApiKey] = useState(user?.agencySettings?.apiKey || 'Generating...');
    const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
        // Load agency jobs
        // In a real implementation, we would filter jobs by agencyId
        // backend.getAgencyJobs(user.id).then(setJobs);
    }, [user?.id]);

    const handleGenerateKey = async () => {
        const newKey = `sk_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
        setApiKey(newKey);
        // await backend.updateAgencySettings(user.id, { apiKey: newKey });
        alert("New API Key Generated. Please update your integrations.");
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <Icons.RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-500">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                            <Icons.Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">Agency<span className="text-indigo-600">Portal</span></h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">B2B Partner</p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                            <Icons.Grid className="w-5 h-5" /> Overview
                        </button>
                        <button onClick={() => setActiveTab('bookings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'bookings' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                            <Icons.List className="w-5 h-5" /> Bookings
                        </button>
                        <button onClick={() => setActiveTab('developers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'developers' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                            <Icons.Code className="w-5 h-5" /> Developers
                        </button>
                        <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                            <Icons.Settings className="w-5 h-5" /> Settings
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Agency Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600">
                                        <Icons.Briefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Bookings</p>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">{jobs.length}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600">
                                        <Icons.DollarSign className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Commission Earned</p>
                                        <h3 className="text-3xl font-black text-emerald-500">${user.totalEarnings?.toFixed(2) || '0.00'}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                                        <Icons.Code className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">API Usage</p>
                                        <h3 className="text-3xl font-black text-blue-500">0 <span className="text-sm text-slate-400">reqs</span></h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity / Quick Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Recent Bookings</h3>
                                {jobs.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                            <Icons.Calendar className="w-8 h-8" />
                                        </div>
                                        <p className="text-slate-500 font-medium mb-4">No bookings found yet.</p>
                                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20">
                                            Create First Booking
                                        </button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm text-left">
                                            <thead className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                                                <tr>
                                                    <th className="pb-3">Date</th>
                                                    <th className="pb-3">Route</th>
                                                    <th className="pb-3">Guest</th>
                                                    <th className="pb-3 text-right">Price</th>
                                                    <th className="pb-3 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {jobs.slice(0, 5).map(job => (
                                                    <tr key={job.id} className="group">
                                                        <td className="py-3 font-medium text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</td>
                                                        <td className="py-3">
                                                            <div className="font-bold text-slate-900 dark:text-white">{job.pickup}</div>
                                                            <div className="text-xs text-slate-500">To: {job.dropoff}</div>
                                                        </td>
                                                        <td className="py-3 font-medium text-slate-700 dark:text-slate-300">{job.clientName || 'Guest'}</td>
                                                        <td className="py-3 text-right font-bold">${job.price}</td>
                                                        <td className="py-3 text-right">
                                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                                                                job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                                                                job.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                                                                'bg-slate-100 text-slate-600'
                                                            }`}>
                                                                {job.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl shadow-indigo-900/20 p-6 text-white">
                                <h3 className="font-bold text-lg mb-2">Quick Actions</h3>
                                <p className="text-indigo-100 text-sm mb-6">Manage your concierge services efficiently.</p>
                                
                                <div className="space-y-3">
                                    <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 p-3 rounded-xl flex items-center gap-3 transition-all text-left">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600">
                                            <Icons.Plus className="w-4 h-4 font-bold" />
                                        </div>
                                        <span className="font-bold text-sm">New Concierge Booking</span>
                                    </button>
                                    
                                    <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 p-3 rounded-xl flex items-center gap-3 transition-all text-left">
                                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white">
                                            <Icons.Link className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm">Create Booking Link</span>
                                    </button>

                                    <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 p-3 rounded-xl flex items-center gap-3 transition-all text-left">
                                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white">
                                            <Icons.Download className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm">Download Report</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'developers' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Developer Settings</h2>
                            <p className="text-slate-500">Manage your API keys and integration settings.</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">API Keys</h3>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-1 bg-slate-100 dark:bg-slate-900 p-4 rounded-xl font-mono text-sm text-slate-600 dark:text-slate-300 break-all">
                                    {apiKey}
                                </div>
                                <button onClick={handleGenerateKey} className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">
                                    Roll Key
                                </button>
                            </div>
                            <p className="text-xs text-slate-400">
                                Use this key in the <code>Authorization</code> header of your API requests: <br/>
                                <code>Authorization: Bearer {apiKey}</code>
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Widget Integration</h3>
                            <p className="text-sm text-slate-500 mb-4">Copy this code to embed the booking form on your website:</p>
                            <div className="p-4 rounded-xl font-mono text-xs overflow-x-auto text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                {`<script src="https://tripfers.com/widget.js" data-key="${apiKey}"></script>`}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
