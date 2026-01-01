import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { backend } from '../services/BackendService';
import { Icons } from '../components/Icons';
import { User, UserRole, UserStatus, Job, PricingConfig, VehicleSettings, IntegrationsConfig, DriverDocument, PromoCode, JobStatus, VehiclePhoto, CompanyProfile, AdminBadgeSettings, PricingThresholds, SupportSettings, BrandingSettings } from '../types';
import { ChatWindow } from '../components/ChatWindow';
import { ConfirmationModal } from '../components/ConfirmationModal';

// --- SUB-COMPONENTS ---

const NavItem = ({ active, onClick, icon: Icon, label, badge, badgeColor = 'bg-red-600' }: any) => (
    <button 
        onClick={onClick} 
        className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group relative ${
            active 
                ? 'bg-red-50 dark:bg-red-900/10 text-red-600 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
        }`}
    >
        <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className={`text-sm tracking-tight ${active ? 'font-black' : 'font-bold'}`}>{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white ${badgeColor} shadow-sm min-w-[20px] text-center`}>
                {badge}
            </span>
        )}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-600 rounded-r-full shadow-[2px_0_8px_rgba(220,38,38,0.3)]" />
        )}
    </button>
);

const HeaderAction = ({ icon: Icon, onClick, badgeCount }: any) => (
    <button 
        onClick={onClick}
        className="p-2.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all relative group"
    >
        <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
        {badgeCount !== undefined && badgeCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border-2 border-white dark:border-slate-800" />
        )}
    </button>
);

const FilterTab = ({ active, onClick, label }: any) => (
    <button 
        onClick={onClick}
        className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
            active 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/10' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
    >
        {label}
    </button>
);

const PageHeader = ({ title, icon: Icon, onBack }: { title: string, icon: any, onBack: () => void }) => (
    <div className="flex items-center gap-4 animate-fade-in-up">
        <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
            <Icon className="w-7 h-7 text-slate-900 dark:text-white" />
        </div>
        <div className="flex flex-col">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h1>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Management Active</span>
            </div>
        </div>
    </div>
);

const StatusBadge = ({ status, className }: { status: string, className?: string }) => (
    <span className={`rounded-lg font-black uppercase tracking-tighter shadow-sm border ${className || 'text-[10px] px-2.5 py-1'} ${
        status === 'ACTIVE' || status === 'ACCEPTED' || status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/50' :
        status === 'PENDING' || status === 'PENDING_VERIFICATION' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800/50' :
        status === 'OFFERS' ? 'bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/50' :
        status === 'CANCELLED' || status === 'REJECTED' || status === 'SUSPENDED' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-800/50' :
        'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/10 dark:text-indigo-400 dark:border-indigo-800/50' // Default for IN_PROGRESS etc.
    }`}>
        {(status || '').replace(/_/g, ' ')}
    </span>
);

const StatCard = ({ title, value, icon, trend, onClick }: any) => (
    <div onClick={onClick} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1">
        <div className="flex justify-between items-start mb-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 w-12 h-12 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-red-600 group-hover:text-white transition-all">
                {icon}
            </div>
            {trend && (
                <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>
                    <Icons.TrendingUp className="w-3 h-3 mr-1" />
                    {trend}
                </div>
            )}
        </div>
        <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
        </div>
    </div>
);

const DispatchMapView = ({ drivers, jobs }: any) => (
    <div className="w-full h-[400px] md:h-[600px] bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center relative overflow-hidden group border border-slate-200 dark:border-slate-600">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
        <div className="text-center z-10">
            <Icons.MapPin className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-500">Global Map</p>
            <p className="text-xs text-slate-400">{drivers.length} Drivers Online • {jobs.length} Active Jobs</p>
        </div>
        {/* Mock driver markers */}
        {drivers.slice(0, 5).map((d: any, i: number) => (
            <div key={d.id} className="absolute w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-xs shadow-lg transform hover:scale-110 transition-transform cursor-pointer" style={{top: `${20 + i*15}%`, left: `${30 + i*10}%`}} title={d.name}>
                <Icons.Car className="w-4 h-4" />
            </div>
        ))}
        {/* Mock Job Markers */}
        {jobs.slice(0, 3).map((j: any, i: number) => (
             <div key={j.id} className="absolute w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg animate-pulse" style={{top: `${40 + i*10}%`, left: `${50 - i*15}%`}} title={`Job #${j.id}`}>
                <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
        ))}
    </div>
);

const TripsView = ({ jobs, onSelectJob, badgeSettings }: any) => {
    const [subTab, setSubTab] = useState<'REQUESTS' | 'UPCOMING' | 'COMPLETE'>('REQUESTS');
    const [locationFilter, setLocationFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    // Calculate Counts for Badges
    const requestCount = jobs.filter((j: Job) => j.status === JobStatus.PENDING || j.status === JobStatus.BIDDING).length;
    const upcomingCount = jobs.filter((j: Job) => [JobStatus.ACCEPTED, JobStatus.DRIVER_EN_ROUTE, JobStatus.DRIVER_ARRIVED, JobStatus.IN_PROGRESS].includes(j.status)).length;
    const completeCount = jobs.filter((j: Job) => [JobStatus.COMPLETED, JobStatus.CANCELLED, JobStatus.REJECTED, JobStatus.DISPUTED].includes(j.status)).length;

    const filteredJobs = jobs.filter((j: Job) => {
        // 1. Tab Logic (Marketplace Model)
        let matchesTab = false;
        if (subTab === 'REQUESTS') {
            matchesTab = j.status === JobStatus.PENDING || j.status === JobStatus.BIDDING;
        } else if (subTab === 'UPCOMING') {
            matchesTab = [JobStatus.ACCEPTED, JobStatus.DRIVER_EN_ROUTE, JobStatus.DRIVER_ARRIVED, JobStatus.IN_PROGRESS].includes(j.status);
        } else if (subTab === 'COMPLETE') {
            matchesTab = [JobStatus.COMPLETED, JobStatus.CANCELLED, JobStatus.REJECTED, JobStatus.DISPUTED].includes(j.status);
        }
        if (!matchesTab) return false;

        // 2. Location Filter
        if (locationFilter) {
            const search = locationFilter.toLowerCase();
            const inPickup = j.pickup.toLowerCase().includes(search);
            const inDropoff = j.dropoff?.toLowerCase().includes(search);
            if (!inPickup && !inDropoff) return false;
        }

        // 3. Date Filter
        if (dateFilter) {
            if (!j.date.startsWith(dateFilter)) return false;
        }

        return true;
    }).sort((a: Job, b: Job) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Sub Tabs */}
            <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                <button 
                    onClick={() => setSubTab('REQUESTS')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all relative ${subTab === 'REQUESTS' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    REQUESTS
                    {badgeSettings.showRequestBadge && requestCount > 0 && (
                        <span className="absolute top-1 right-2 w-5 h-5 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center shadow-sm">
                            {requestCount}
                        </span>
                    )}
                </button>
                <button 
                    onClick={() => setSubTab('UPCOMING')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all relative ${subTab === 'UPCOMING' ? 'bg-blue-100 text-blue-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    UPCOMING
                    {badgeSettings.showUpcomingBadge && upcomingCount > 0 && (
                        <span className="absolute top-1 right-2 w-5 h-5 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center shadow-sm">
                            {upcomingCount}
                        </span>
                    )}
                </button>
                <button 
                    onClick={() => setSubTab('COMPLETE')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all relative ${subTab === 'COMPLETE' ? 'bg-green-100 text-green-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    COMPLETE
                    {badgeSettings.showCompleteBadge && completeCount > 0 && (
                        <span className="absolute top-1 right-2 w-5 h-5 bg-green-500 text-white text-[10px] rounded-full flex items-center justify-center shadow-sm">
                            {completeCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Filter by Country, City, or Address..." 
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                </div>
                <div className="relative w-full md:w-auto">
                    <input 
                        type="date" 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                </div>
            </div>

            {/* Job List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">Created At</th>
                                <th className="p-4">Route</th>
                                <th className="p-4">Client</th>
                                <th className="p-4">Activity</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Bids</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredJobs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">No trips found in this category.</td>
                                </tr>
                            ) : (
                                filteredJobs.map((j: Job) => (
                                    <tr key={j.id} onClick={() => onSelectJob(j)} className="hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                        <td className="p-4 whitespace-nowrap text-slate-500">
                                            {new Date(j.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            <div className="text-xs text-slate-400">{new Date(j.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold dark:text-white">{j.pickup}</div>
                                            <div className="text-xs text-slate-500">To: {j.dropoff || 'Hourly'}</div>
                                        </td>
                                        <td className="p-4 text-slate-700 dark:text-slate-300">
                                            {j.clientName || 'Guest'}
                                        </td>
                                        <td className="p-4">
                                            {/* Marketplace Info: Show Bids count or Assigned Driver */}
                                            {j.driverName ? (
                                                <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                                                    <Icons.Car className="w-3 h-3"/> {j.driverName}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-slate-500 text-xs">
                                                    <Icons.Bell className="w-3 h-3"/> {j.bids?.length || 0} Offers
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={j.status === JobStatus.BIDDING ? 'OFFERS' : j.status} />
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`font-bold text-sm ${j.bids && j.bids.length > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                                {j.bids ? j.bids.length : 0}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-blue-600 font-bold text-xs hover:underline">View</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const DisputesView = ({ jobs, onResolve }: any) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-bold text-lg mb-4 dark:text-white">Active Disputes</h3>
        {jobs.filter((j: Job) => j.status === JobStatus.DISPUTED).length === 0 ? (
            <p className="text-slate-500 text-sm">No active disputes.</p>
        ) : (
            <div className="space-y-4">
                {jobs.filter((j: Job) => j.status === JobStatus.DISPUTED).map((j: Job) => (
                    <div key={j.id} className="border border-red-200 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-red-700 dark:text-red-400">Dispute #{j.id}</h4>
                            <span className="text-xs text-red-600 bg-white px-2 py-1 rounded border border-red-100">Urgent</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{j.disputeReason || 'Customer reported an issue.'}</p>
                        <div className="flex gap-2">
                            <button onClick={() => onResolve(j.id, 'REFUND')} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Refund Client</button>
                            <button onClick={() => onResolve(j.id, 'PAY_DRIVER')} className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold">Pay Driver</button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const MarketingView = ({ onUpdate }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg mb-4 dark:text-white">Promo Codes</h3>
            <button onClick={() => backend.createPromoCode({ code: 'NEW20', value: 20 }).then(onUpdate)} className="w-full bg-black text-white py-3 rounded-xl font-bold mb-4">Create New Code</button>
            <div className="space-y-2">
                <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <span className="font-mono font-bold">WELCOME20</span>
                    <span className="text-green-600 font-bold">Active</span>
                </div>
            </div>
        </div>
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg mb-4 dark:text-white">Campaigns</h3>
            <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                Create your first email campaign
            </div>
        </div>
    </div>
);

const BroadcastView = () => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-4 dark:text-white">System Broadcast</h3>
        <textarea className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mb-4" placeholder="Type your message to all users..."></textarea>
        <div className="flex gap-4">
             <label className="flex items-center gap-2"><input type="checkbox"/> <span className="text-sm">Push Notification</span></label>
             <label className="flex items-center gap-2"><input type="checkbox"/> <span className="text-sm">Email</span></label>
        </div>
        <button className="mt-4 bg-black text-white px-6 py-3 rounded-xl font-bold">Send Broadcast</button>
    </div>
);

const SettingsView = ({ 
    badgeSettings, 
    onUpdateBadges,
    brandingSettings,
    onUpdateBranding
}: { 
    badgeSettings: AdminBadgeSettings, 
    onUpdateBadges: (s: AdminBadgeSettings) => void,
    brandingSettings: BrandingSettings | null,
    onUpdateBranding: (s: BrandingSettings) => void
}) => {
    const [localBranding, setLocalBranding] = useState<BrandingSettings>({
        mainFaviconUrl: brandingSettings?.mainFaviconUrl || '',
        adminFaviconUrl: brandingSettings?.adminFaviconUrl || '',
        loginFormImageUrl: brandingSettings?.loginFormImageUrl || ''
    });
    const [showSaved, setShowSaved] = useState(false);

    useEffect(() => {
        if (brandingSettings) {
            setLocalBranding(brandingSettings);
        }
    }, [brandingSettings]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const handleClickAnywhere = () => setShowSaved(false);

        if (showSaved) {
            timer = setTimeout(() => setShowSaved(false), 3000);
            // Add listener after a small delay to avoid immediate trigger from the save button click
            setTimeout(() => document.addEventListener('click', handleClickAnywhere), 100);
        }

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickAnywhere);
        };
    }, [showSaved]);

    const handleSaveBranding = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent immediate dismissal
        onUpdateBranding(localBranding);
        setShowSaved(true);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg mb-6 dark:text-white">Admin Settings</h3>
            
            <div className="space-y-8">
                {/* BRANDING SECTION */}
                <div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                        <Icons.Image className="w-4 h-4"/> Branding & Appearance
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Main Site Favicon URL</label>
                            <div className="flex gap-2 items-center">
                                {localBranding.mainFaviconUrl && (
                                    <img src={localBranding.mainFaviconUrl} alt="Preview" className="w-9 h-9 p-1 bg-white rounded border border-slate-200 object-contain" />
                                )}
                                <input 
                                    type="text" 
                                    value={localBranding.mainFaviconUrl}
                                    onChange={e => setLocalBranding({...localBranding, mainFaviconUrl: e.target.value})}
                                    className="flex-1 p-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 dark:text-white"
                                    placeholder="https://example.com/favicon.png"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Admin Portal Favicon URL</label>
                            <div className="flex gap-2 items-center">
                                {localBranding.adminFaviconUrl && (
                                    <img src={localBranding.adminFaviconUrl} alt="Preview" className="w-9 h-9 p-1 bg-white rounded border border-slate-200 object-contain" />
                                )}
                                <input 
                                    type="text" 
                                    value={localBranding.adminFaviconUrl}
                                    onChange={e => setLocalBranding({...localBranding, adminFaviconUrl: e.target.value})}
                                    className="flex-1 p-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 dark:text-white"
                                    placeholder="https://example.com/admin-favicon.png"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Login Form Image URL</label>
                            <div className="flex gap-2 items-center">
                                {localBranding.loginFormImageUrl && (
                                    <img src={localBranding.loginFormImageUrl} alt="Preview" className="w-9 h-9 p-1 bg-white rounded border border-slate-200 object-contain" />
                                )}
                                <input 
                                    type="text" 
                                    value={localBranding.loginFormImageUrl || ''}
                                    onChange={e => setLocalBranding({...localBranding, loginFormImageUrl: e.target.value})}
                                    className="flex-1 p-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 dark:text-white"
                                    placeholder="https://example.com/login-logo.png"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Image to display at the top of the Login/Register form.</p>
                        </div>

                        <div className="flex justify-start pt-2 items-center gap-4 relative">
                            <button 
                                onClick={handleSaveBranding}
                                className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                            >
                                Save Branding
                            </button>
                            {showSaved && (
                                <div className="absolute left-32 bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg animate-fade-in flex items-center gap-2 z-10 whitespace-nowrap">
                                    <Icons.Check className="w-3 h-3" /> Changes Saved!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Notification Badges</h4>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <span className="font-medium dark:text-white">Show 'Trips' Badge (Sidebar)</span>
                            <input 
                                type="checkbox" 
                                checked={badgeSettings.showTripsBadge} 
                                onChange={e => onUpdateBadges({...badgeSettings, showTripsBadge: e.target.checked})}
                                className="w-5 h-5 accent-blue-600"
                            />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <span className="font-medium dark:text-white">Show 'Requests' Count</span>
                            <input 
                                type="checkbox" 
                                checked={badgeSettings.showRequestBadge} 
                                onChange={e => onUpdateBadges({...badgeSettings, showRequestBadge: e.target.checked})}
                                className="w-5 h-5 accent-blue-600"
                            />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <span className="font-medium dark:text-white">Show 'Upcoming' Count</span>
                            <input 
                                type="checkbox" 
                                checked={badgeSettings.showUpcomingBadge} 
                                onChange={e => onUpdateBadges({...badgeSettings, showUpcomingBadge: e.target.checked})}
                                className="w-5 h-5 accent-blue-600"
                            />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <span className="font-medium dark:text-white">Show 'Complete' Count</span>
                            <input 
                                type="checkbox" 
                                checked={badgeSettings.showCompleteBadge} 
                                onChange={e => onUpdateBadges({...badgeSettings, showCompleteBadge: e.target.checked})}
                                className="w-5 h-5 accent-blue-600"
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserDetailsModal = ({ user, onClose, onUpdate, onPayout }: any) => {
    if (!user) return null;

    const handleUpdatePhotoStatus = async (vehicleId: string, photoId: string, newStatus: 'APPROVED' | 'REJECTED') => {
         const updatedVehicles = user.vehicles?.map((v: VehicleSettings) => {
            if (v.id === vehicleId) {
                return {
                    ...v,
                    photos: v.photos.map((p: VehiclePhoto) => 
                        p.id === photoId ? { ...p, status: newStatus } : p
                    )
                };
            }
            return v;
        });

        if (updatedVehicles) {
            await backend.updateDriverVehicles(user.id, updatedVehicles);
            onUpdate();
        }
    };

    const handleUpdatePaymentStatus = async (status: 'APPROVED' | 'REJECTED') => {
        await backend.adminApprovePaymentDetails(user.id, status);
        onUpdate();
    };

    const handleUpdateDocumentStatus = async (docId: string, status: 'APPROVED' | 'REJECTED') => {
        await backend.adminUpdateDocumentStatus(user.id, docId, status);
        onUpdate();
    };

    const DOC_LABELS: Record<string, string> = {
        'LICENSE_SELFIE': "Selfie with Driver's License",
        'VRC': "Vehicle Registration Certificate",
        'VRC_PHOTO': "Photo of Vehicle with VRC",
        'INSURANCE': "Insurance Policy",
        'TRANSPORT_LICENSE': "Transportation License"
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
                 <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                     <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl font-bold shadow-sm">
                             {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover"/> : user.name.charAt(0)}
                         </div>
                         <div>
                             <h3 className="font-bold text-lg dark:text-white">{user.name}</h3>
                             <p className="text-xs text-slate-500">{user.email}</p>
                         </div>
                     </div>
                     <button onClick={onClose}><Icons.X className="w-6 h-6 dark:text-white"/></button>
                 </div>
                 
                 <div className="p-6 space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                             <p className="text-xs font-bold text-slate-400 uppercase">Role</p>
                             <p className="font-bold dark:text-white">{user.role}</p>
                         </div>
                         <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                             <p className="text-xs font-bold text-slate-400 uppercase">Balance</p>
                             <p className="font-bold text-green-600">${user.balance || 0}</p>
                         </div>
                     </div>

                     {user.role === UserRole.DRIVER && (
                        <>
                         {/* PAYMENT VERIFICATION SECTION */}
                         <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-xl border border-slate-200 dark:border-slate-600">
                            <h4 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
                                <Icons.DollarSign className="w-5 h-5"/> Payment Verification
                            </h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">PayPal Email</p>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-600 gap-3">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Icons.Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            <span className="font-mono text-sm sm:text-base dark:text-white break-all">{user.paypalEmail || 'Not provided'}</span>
                                        </div>
                                        
                                        <div className="flex-shrink-0">
                                            {user.paymentVerificationStatus === 'PENDING' && (
                                                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs px-3 py-1.5 rounded-lg font-bold animate-pulse w-full sm:w-auto justify-center">
                                                    <Icons.Clock className="w-3 h-3" /> VERIFICATION NEEDED
                                                </span>
                                            )}
                                            {user.paymentVerificationStatus === 'APPROVED' && (
                                                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-lg font-bold w-full sm:w-auto justify-center">
                                                    <Icons.Check className="w-3 h-3" /> APPROVED
                                                </span>
                                            )}
                                            {user.paymentVerificationStatus === 'REJECTED' && (
                                                <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded-lg font-bold w-full sm:w-auto justify-center">
                                                    <Icons.X className="w-3 h-3" /> REJECTED
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button 
                                        onClick={() => handleUpdatePaymentStatus('APPROVED')}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
                                    >
                                        <Icons.Check className="w-4 h-4" /> Approve Payment
                                    </button>
                                    <button 
                                        onClick={() => handleUpdatePaymentStatus('REJECTED')}
                                        className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
                                    >
                                        <Icons.X className="w-4 h-4" /> Reject
                                    </button>
                                </div>
                            </div>
                        </div>

                         <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                             <h4 className="font-bold mb-4 dark:text-white flex items-center gap-2">
                                <Icons.FileText className="w-5 h-5 text-slate-500" />
                                Driver Documents
                             </h4>
                             {user.documents && user.documents.length > 0 ? (
                                 <div className="space-y-4">
                                     {user.documents.map((doc: any) => (
                                         <div key={doc.id} className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                                             <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
                                                 <div>
                                                     <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                                                         {DOC_LABELS[doc.type] || doc.type}
                                                     </p>
                                                     <p className="text-xs text-slate-500">
                                                         {new Date(doc.uploadedAt).toLocaleDateString()} • {new Date(doc.uploadedAt).toLocaleTimeString()}
                                                     </p>
                                                 </div>
                                                 <StatusBadge status={doc.status} />
                                             </div>
                                             
                                             <div className="p-3 bg-slate-50 dark:bg-slate-900 flex flex-wrap gap-2 items-center justify-between">
                                                 <a 
                                                     href={doc.url} 
                                                     target="_blank" 
                                                     rel="noreferrer"
                                                     className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
                                                 >
                                                     <Icons.Eye className="w-4 h-4" /> View File
                                                 </a>
                                                 
                                                 <div className="flex gap-2 flex-1 min-w-[200px] justify-end">
                                                     {doc.status !== 'APPROVED' && (
                                                         <button 
                                                             onClick={() => handleUpdateDocumentStatus(doc.id, 'APPROVED')}
                                                             className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                                                         >
                                                             <Icons.Check className="w-4 h-4" /> Approve
                                                         </button>
                                                     )}
                                                     {doc.status !== 'REJECTED' && (
                                                         <button 
                                                             onClick={() => handleUpdateDocumentStatus(doc.id, 'REJECTED')}
                                                             className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all active:scale-95"
                                                         >
                                                             <Icons.X className="w-4 h-4" /> Reject
                                                         </button>
                                                     )}
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             ) : (
                                 <div className="text-center py-8 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                     <Icons.File className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                     <p className="text-sm text-slate-500">No documents uploaded yet.</p>
                                 </div>
                             )}
                        </div>

                        {/* Vehicle Photos Approval Section */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                            <h4 className="font-bold mb-4 dark:text-white">Vehicle Photos</h4>
                            {user.vehicles && user.vehicles.length > 0 ? (
                                <div className="space-y-4">
                                    {user.vehicles.map((v: VehicleSettings) => (
                                        <div key={v.id} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
                                            <p className="text-xs font-bold text-slate-500 mb-2 uppercase">{v.make} {v.model} ({v.plate})</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {v.photos && v.photos.map((p: VehiclePhoto) => (
                                                    <div key={p.id} className="relative group aspect-square">
                                                        <img src={p.url} className="w-full h-full object-cover rounded-lg bg-slate-200" />
                                                        <div className="absolute top-1 right-1 z-10">
                                                            {p.status === 'APPROVED' && <div className="bg-green-500 text-white p-1 rounded-full shadow-sm"><Icons.Check className="w-3 h-3"/></div>}
                                                            {p.status === 'REJECTED' && <div className="bg-red-500 text-white p-1 rounded-full shadow-sm"><Icons.X className="w-3 h-3"/></div>}
                                                            {p.status === 'PENDING' && <div className="bg-amber-500 text-white p-1 rounded-full shadow-sm"><Icons.Clock className="w-3 h-3"/></div>}
                                                        </div>
                                                        
                                                        {/* Admin Controls Overlay */}
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg backdrop-blur-sm">
                                                            <button onClick={() => handleUpdatePhotoStatus(v.id, p.id, 'APPROVED')} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-transform hover:scale-110" title="Approve"><Icons.Check className="w-4 h-4"/></button>
                                                            <button onClick={() => handleUpdatePhotoStatus(v.id, p.id, 'REJECTED')} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-transform hover:scale-110" title="Reject"><Icons.X className="w-4 h-4"/></button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!v.photos || v.photos.length === 0) && <p className="text-xs text-slate-400 italic col-span-full">No photos uploaded</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-slate-500">No vehicles added.</p>}
                        </div>
                    </>
                    )}

                     <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                         {user.role === UserRole.DRIVER && (
                             <button onClick={() => onPayout(user.id, user.balance || 0)} className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm">Process Payout</button>
                         )}
                         <button onClick={() => backend.deleteUser(user.id).then(() => { onUpdate(); onClose(); })} className="text-red-600 font-bold text-sm px-4">Delete User</button>
                     </div>
                 </div>
             </div>
        </div>
    );
}

const TripDetailsModal = ({ job, onClose, onUpdate, users, adminUser }: { job: Job, onClose: () => void, onUpdate: () => void, users: User[], adminUser: User | null }) => {
    const [price, setPrice] = useState(job.price || 0);
    const [showChat, setShowChat] = useState(false);

    const handlePriceOverride = async () => {
        await backend.adminOverridePrice(job.id, price);
        onUpdate();
    };

    const handleCancel = async () => {
        if(confirm('Are you sure? This will cancel the booking for both client and driver.')) {
            await backend.cancelJob(job.id);
            onUpdate();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">Trip #{job.id}</h3>
                        <p className="text-xs text-slate-500">{new Date(job.date).toLocaleString()}</p>
                    </div>
                    <button onClick={onClose}><Icons.X className="w-6 h-6 dark:text-white" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pickup</p>
                            <p className="font-bold dark:text-white">{job.pickup}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Dropoff</p>
                            <p className="font-bold dark:text-white">{job.dropoff || 'Hourly'}</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                         <div className="flex-1">
                             <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Price Override ($)</label>
                             <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    value={price} 
                                    onChange={e => setPrice(Number(e.target.value))} 
                                    autoFocus
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                                <button onClick={handlePriceOverride} className="bg-black text-white px-4 rounded font-bold text-xs">Save</button>
                             </div>
                         </div>
                         <div className="flex-1">
                             <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Status</label>
                             <StatusBadge status={job.status} className="text-sm px-3 py-1.5" />
                         </div>
                    </div>

                    {/* MARKETPLACE: ACTIVE OFFERS - DETAILED LIST */}
                    {job.bids && job.bids.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-3 flex items-center gap-2">
                                <Icons.Bell className="w-3 h-3"/> Active Offers (Marketplace Activity)
                            </h4>
                            <div className="space-y-3">
                                {job.bids.map(bid => {
                                    const driver = users.find(u => u.id === bid.driverId);
                                    const vehiclePhoto = driver?.vehicles?.[0]?.photos?.[0]?.url;
                                    
                                    return (
                                        <div key={bid.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                                            <div className="flex items-center gap-3 w-full md:w-1/3">
                                                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 shrink-0">
                                                    {driver?.avatar ? <img src={driver.avatar} className="w-full h-full rounded-full object-cover"/> : bid.driverName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm dark:text-white">{bid.driverName}</p>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                                        <Icons.Star className="w-3 h-3 text-amber-400 fill-amber-400 stroke-none"/>
                                                        {driver?.rating || 5.0} • {driver?.company?.baseLocation || 'Unknown'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 w-full md:w-1/3 flex items-center gap-3 border-l border-slate-100 dark:border-slate-700 pl-0 md:pl-4">
                                                {vehiclePhoto && (
                                                    <img src={vehiclePhoto} className="w-16 h-12 object-cover rounded bg-slate-100" alt="Car"/>
                                                )}
                                                <div>
                                                    <p className="font-bold text-sm dark:text-white">{bid.vehicleDescription}</p>
                                                    <p className="text-xs text-slate-500">{driver?.vehicles?.[0]?.type || 'Standard'}</p>
                                                </div>
                                            </div>

                                            <div className="text-right w-full md:w-auto">
                                                <p className="font-black text-xl text-slate-900 dark:text-white">${bid.amount}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(bid.timestamp).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {job.driverId && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 flex justify-between items-center">
                            <div>
                                <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-1">Driver in Charge</p>
                                <p className="font-bold dark:text-white text-lg">{job.driverName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500">Agreed Price</p>
                                <p className="font-black text-xl">${job.price}</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl">
                        <div className="p-4 flex justify-between items-center">
                            <h4 className="font-bold text-sm dark:text-white flex items-center gap-2"><Icons.MessageCircle className="w-4 h-4 text-slate-400"/> Communication Log</h4>
                            <button
                                onClick={() => setShowChat(!showChat)}
                                className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg"
                            >
                                {showChat ? 'Hide' : 'Show'} Chat ({job.messages?.length || 0})
                            </button>
                        </div>
                        {showChat && adminUser && (
                            <div className="h-96 p-4 pt-0 border-t border-slate-200 dark:border-slate-700">
                                <ChatWindow
                                    jobId={job.id}
                                    currentUser={adminUser}
                                    otherUserName={`Conversation`}
                                    isReadOnly={true}
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-6 flex justify-end">
                        <button onClick={handleCancel} className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors">Cancel Trip (Admin Force)</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MatsView = ({ thresholds, onUpdate, onBack }: any) => {
    const [localThresholds, setLocalThresholds] = useState<PricingThresholds>(thresholds || {
        highAlertPercent: 50, lowAlertPercent: 50, fairOfferPercent: 35, goodOfferPercent: 10
    });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (thresholds) setLocalThresholds(thresholds);
    }, [thresholds]);

    const handleChange = (key: keyof PricingThresholds, value: number) => {
        setLocalThresholds(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onUpdate(localThresholds);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="max-w-4xl space-y-8 animate-fade-in">
            <PageHeader title="Trip Prices" icon={Icons.Sliders} onBack={onBack} />
            <p className="text-slate-500 -mt-6">Configure the percentage thresholds for driver offer warnings.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* RED WARNINGS */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-red-600">
                        <Icons.AlertTriangle className="w-6 h-6" />
                        <h3 className="font-bold text-lg">Red Warnings (Extreme)</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">High Price Threshold (%)</label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-bold">&gt; +</span>
                                <input 
                                    type="number" 
                                    value={localThresholds.highAlertPercent}
                                    onChange={e => handleChange('highAlertPercent', Number(e.target.value))}
                                    className="w-20 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-bold"
                                />
                                <span className="text-slate-500">% above estimate</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Shows "Price too high" warning.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Low Price Threshold (%)</label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-bold">&lt; -</span>
                                <input 
                                    type="number" 
                                    value={localThresholds.lowAlertPercent}
                                    onChange={e => handleChange('lowAlertPercent', Number(e.target.value))}
                                    className="w-20 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-bold"
                                />
                                <span className="text-slate-500">% below estimate</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Shows "Price too low" warning.</p>
                        </div>
                    </div>
                </div>

                {/* COMPETITIVE WARNINGS */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-blue-600">
                        <Icons.Info className="w-6 h-6" />
                        <h3 className="font-bold text-lg">Competitive Ranges</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 text-green-600">Green Zone (Highly Chance)</label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-bold">+/-</span>
                                <input 
                                    type="number" 
                                    value={localThresholds.goodOfferPercent}
                                    onChange={e => handleChange('goodOfferPercent', Number(e.target.value))}
                                    className="w-20 p-2 bg-slate-50 dark:bg-slate-900 border border-green-200 dark:border-green-800 rounded font-bold text-green-700"
                                />
                                <span className="text-slate-500">% from estimate</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Shows "High chance to get trip" (Green).</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 text-blue-600">Blue Zone (Fair/Great Value)</label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-bold">+/-</span>
                                <input 
                                    type="number" 
                                    value={localThresholds.fairOfferPercent}
                                    onChange={e => handleChange('fairOfferPercent', Number(e.target.value))}
                                    className="w-20 p-2 bg-slate-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded font-bold text-blue-700"
                                />
                                <span className="text-slate-500">% from estimate</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Shows "Fair price" / "Great value" (Blue).</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleSave} 
                    className={`px-8 py-3 rounded-xl font-bold text-white transition-all ${saved ? 'bg-green-500' : 'bg-black hover:bg-slate-800'}`}
                >
                    {saved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

const SupportView = ({ settings, onUpdate, onBack }: { settings: SupportSettings, onUpdate: (s: SupportSettings) => void, onBack: () => void }) => {
    const [localSettings, setLocalSettings] = useState<SupportSettings>(settings);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSave = () => {
        onUpdate(localSettings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="max-w-4xl space-y-8 animate-fade-in">
            <PageHeader title="Support Configuration" icon={Icons.HelpCircle} onBack={onBack} />
            <p className="text-slate-500 -mt-6">Manage contact details displayed to drivers and clients.</p>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Finance Email</label>
                        <input 
                            type="email" 
                            value={localSettings.financeEmail}
                            onChange={e => setLocalSettings({...localSettings, financeEmail: e.target.value})}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                            placeholder="finance@example.com"
                        />
                        <p className="text-xs text-slate-400 mt-1">Displayed in Driver Payment Details.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">General Support Email</label>
                        <input 
                            type="email" 
                            value={localSettings.supportEmail}
                            onChange={e => setLocalSettings({...localSettings, supportEmail: e.target.value})}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                            placeholder="support@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Support Phone</label>
                        <input 
                            type="text" 
                            value={localSettings.supportPhone}
                            onChange={e => setLocalSettings({...localSettings, supportPhone: e.target.value})}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                            placeholder="+1 555 0000"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">WhatsApp Number</label>
                        <input 
                            type="text" 
                            value={localSettings.whatsappNumber || ''}
                            onChange={e => setLocalSettings({...localSettings, whatsappNumber: e.target.value})}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                            placeholder="+1 555 0000"
                        />
                         <p className="text-xs text-slate-400 mt-1">Used for direct WhatsApp links (format: international, no spaces preferred).</p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={handleSave} 
                        className={`px-8 py-3 rounded-xl font-bold text-white transition-all ${saved ? 'bg-green-500' : 'bg-black hover:bg-slate-800'}`}
                    >
                        {saved ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// FIX: Export AdminDashboard component
export const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
    const [integrationsConfig, setIntegrationsConfig] = useState<IntegrationsConfig | null>(null);
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [badgeSettings, setBadgeSettings] = useState<AdminBadgeSettings | null>(null);
    const [thresholds, setThresholds] = useState<PricingThresholds | null>(null);
    const [supportSettings, setSupportSettings] = useState<SupportSettings | null>(null);
    const [brandingSettings, setBrandingSettings] = useState<BrandingSettings | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile
    const [showResetModal, setShowResetModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showIntegrationsSaved, setShowIntegrationsSaved] = useState(false);
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

    const toggleVisibility = (field: string) => {
        setVisibleKeys(prev => ({ ...prev, [field]: !prev[field] }));
    };

    // Handle "Saved" popup auto-dismiss and click-outside
    useEffect(() => {
        let timer: NodeJS.Timeout;
        const handleClickAnywhere = () => setShowIntegrationsSaved(false);

        if (showIntegrationsSaved) {
            timer = setTimeout(() => setShowIntegrationsSaved(false), 3000);
            // Add listener after a small delay to avoid immediate trigger from the save button click
            setTimeout(() => document.addEventListener('click', handleClickAnywhere), 100);
        }

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickAnywhere);
        };
    }, [showIntegrationsSaved]);

    // Modals
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [filterRole, setFilterRole] = useState<'ALL' | 'DRIVER' | 'CLIENT'>('ALL'); // Added Filter State
    const adminUser = backend.getCurrentUser(); // Assuming admin is logged in.

    // FIX: Keep selectedUser and selectedJob in sync with real-time updates
    useEffect(() => {
        if (selectedUser) {
            const updatedUser = users.find(u => u.id === selectedUser.id);
            // Only update if data actually changed to avoid loop
            if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(selectedUser)) {
                setSelectedUser(updatedUser);
            }
        }
    }, [users, selectedUser]);

    useEffect(() => {
        if (selectedJob) {
            const updatedJob = jobs.find(j => j.id === selectedJob.id);
            if (updatedJob && JSON.stringify(updatedJob) !== JSON.stringify(selectedJob)) {
                setSelectedJob(updatedJob);
            }
        }
    }, [jobs, selectedJob]);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            
            // Safe check for new method to prevent crashes if HMR is stale
            const thresholdsPromise = backend.getPricingThresholds 
                ? backend.getPricingThresholds() 
                : Promise.resolve({
                    highAlertPercent: 50, 
                    lowAlertPercent: 50, 
                    fairOfferPercent: 35, 
                    goodOfferPercent: 10
                  });

            const supportSettingsPromise = backend.getSupportSettings 
                ? backend.getSupportSettings() 
                : Promise.resolve({
                    financeEmail: 'finance@tripfers.com',
                    supportEmail: 'support@tripfers.com',
                    supportPhone: '+1 555 0199',
                    whatsappNumber: '+1 555 0199'
                  });

            const brandingSettingsPromise = backend.getBrandingSettings
                ? backend.getBrandingSettings()
                : Promise.resolve({
                    mainFaviconUrl: '/favicon.png',
                    adminFaviconUrl: '/favicon_admin.png'
                });

            const [fetchedStats, fetchedUsers, fetchedJobs, fetchedPricing, fetchedPromoCodes, fetchedBadgeSettings, fetchedThresholds, fetchedSupportSettings, fetchedBrandingSettings] = await Promise.all([
                backend.getStats(),
                backend.getAllUsers(),
                backend.getJobs(UserRole.ADMIN),
                backend.getPricingConfig(),
                backend.getPromoCodes(),
                backend.getAdminBadgeSettings(),
                thresholdsPromise,
                supportSettingsPromise,
                brandingSettingsPromise
            ]);
            setStats(fetchedStats);
            setUsers(fetchedUsers);
            setJobs(fetchedJobs);
            setPricingConfig(fetchedPricing);
            // setIntegrationsConfig(fetchedIntegrations); // Fetched separately once
            setPromoCodes(fetchedPromoCodes);
            setBadgeSettings(fetchedBadgeSettings);
            setThresholds(fetchedThresholds);
            setSupportSettings(fetchedSupportSettings);
            setBrandingSettings(fetchedBrandingSettings);
        } catch (err) {
            console.error("AdminDashboard fetch error:", err);
            setError("Failed to load dashboard data. Please refresh the page.");
        }
    }, []);

    // Fetch integrations only once on mount to prevent overwriting user input
    useEffect(() => {
        const fetchIntegrations = async () => {
             const integrations = await backend.getIntegrations();
             setIntegrationsConfig(integrations);
        };
        fetchIntegrations();
    }, []);

    useEffect(() => {
        fetchData();
        const unsubscribe = backend.subscribe(fetchData);
        return () => {
            unsubscribe();
        };
    }, [fetchData]);

    const handleUpdatePricing = async (config: PricingConfig) => {
        await backend.updatePricingConfig(config);
        fetchData();
    };

    const handleUpdateIntegrations = async (config: IntegrationsConfig) => {
        try {
            await backend.updateIntegrations(config);
            setShowIntegrationsSaved(true);
            // Timeout is now handled by useEffect
            fetchData();
        } catch (error) {
            console.error("Failed to save integrations:", error);
            alert("Failed to save settings! Permission denied or network error.\nPlease check the console for details.");
        }
    };

    const handleUpdateBadges = async (settings: AdminBadgeSettings) => {
        await backend.updateAdminBadgeSettings(settings);
        fetchData();
    };

    const handleUpdateThresholds = async (newThresholds: PricingThresholds) => {
        await backend.updatePricingThresholds(newThresholds);
        fetchData();
    };

    const handleUpdateSupportSettings = async (newSettings: SupportSettings) => {
        await backend.updateSupportSettings(newSettings);
        fetchData();
    };

    const handleUpdateBranding = async (newSettings: BrandingSettings) => {
        if (backend.updateBrandingSettings) {
            await backend.updateBrandingSettings(newSettings);
            fetchData();
        }
    };
    
    const handleResolveDispute = async (jobId: string, resolution: 'REFUND' | 'PAY_DRIVER' | 'SPLIT') => {
        await backend.resolveDispute(jobId, resolution);
        fetchData();
    };

    const handleProcessPayout = async (userId: string, amount: number) => {
        if (confirm(`Process a payout of $${amount} for user ID: ${userId}?`)) {
            await backend.manualPayout(userId, amount);
            fetchData();
            setSelectedUser(null);
        }
    };

    const getBadgeCount = (type: 'requests' | 'upcoming' | 'complete') => {
        if (!badgeSettings) return 0;
        if (type === 'requests' && badgeSettings.showRequestBadge) {
            return jobs.filter((j: Job) => j.status === JobStatus.PENDING || j.status === JobStatus.BIDDING).length;
        }
        if (type === 'upcoming' && badgeSettings.showUpcomingBadge) {
            return jobs.filter((j: Job) => [JobStatus.ACCEPTED, JobStatus.DRIVER_EN_ROUTE, JobStatus.DRIVER_ARRIVED, JobStatus.IN_PROGRESS].includes(j.status)).length;
        }
        if (type === 'complete' && badgeSettings.showCompleteBadge) {
            return jobs.filter((j: Job) => [JobStatus.COMPLETED, JobStatus.CANCELLED, JobStatus.REJECTED, JobStatus.DISPUTED].includes(j.status)).length;
        }
        return 0;
    };

    const sidebarRef = useRef<HTMLElement>(null);

    // --- SIDEBAR CLOSE ON CLICK OUTSIDE ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setIsSidebarOpen(false);
            }
        };

        if (isSidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSidebarOpen]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setIsSidebarOpen(false);
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 font-sans selection:bg-red-100 selection:text-red-900 p-0 m-0">
            {/* Sidebar Backdrop (Mobile Only) */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] animate-fade-in md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside 
                ref={sidebarRef}
                className={`w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col fixed inset-y-0 left-0 z-[80] transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Sidebar Header */}
                <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
                            <Icons.Shield className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            {/* Logo Text Removed */}
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Admin Portal</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
                    {/* OVERVIEW Group */}
                    <div>
                        <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Overview</h3>
                        <div className="space-y-1">
                            <NavItem 
                                active={activeTab === 'dashboard'} 
                                onClick={() => handleTabChange('dashboard')} 
                                icon={Icons.LayoutDashboard} 
                                label="Dashboard" 
                            />
                        </div>
                    </div>

                    {/* OPERATIONS Group */}
                    <div>
                        <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Operations</h3>
                        <div className="space-y-1">
                            <NavItem 
                                active={activeTab === 'trips'} 
                                onClick={() => handleTabChange('trips')} 
                                icon={Icons.Route} 
                                label="Trips" 
                                badge={getBadgeCount('requests') + getBadgeCount('upcoming') + getBadgeCount('complete')}
                                badgeColor="bg-red-600"
                            />
                            <NavItem 
                                active={activeTab === 'users'} 
                                onClick={() => handleTabChange('users')} 
                                icon={Icons.Users} 
                                label="Users" 
                            />
                            <NavItem 
                                active={activeTab === 'disputes'} 
                                onClick={() => handleTabChange('disputes')} 
                                icon={Icons.Gavel} 
                                label="Disputes" 
                            />
                        </div>
                    </div>

                    {/* CONFIGURATION Group */}
                    <div>
                        <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Configuration</h3>
                        <div className="space-y-1">
                            <NavItem 
                                active={activeTab === 'pricing'} 
                                onClick={() => handleTabChange('pricing')} 
                                icon={Icons.DollarSign} 
                                label="Trip Fares" 
                            />
                            <NavItem 
                                active={activeTab === 'mats'} 
                                onClick={() => handleTabChange('mats')} 
                                icon={Icons.Sliders} 
                                label="Trip Prices" 
                            />
                            <NavItem 
                                active={activeTab === 'integrations'} 
                                onClick={() => handleTabChange('integrations')} 
                                icon={Icons.Plug} 
                                label="Integrations" 
                            />
                            <NavItem 
                                active={activeTab === 'settings'} 
                                onClick={() => handleTabChange('settings')} 
                                icon={Icons.Settings} 
                                label="Settings" 
                            />
                        </div>
                    </div>

                    {/* TOOLS Group */}
                    <div>
                        <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Tools</h3>
                        <div className="space-y-1">
                            <NavItem 
                                active={activeTab === 'marketing'} 
                                onClick={() => handleTabChange('marketing')} 
                                icon={Icons.Megaphone} 
                                label="Marketing" 
                            />
                            <NavItem 
                                active={activeTab === 'broadcast'} 
                                onClick={() => handleTabChange('broadcast')} 
                                icon={Icons.Bell} 
                                label="Broadcast" 
                            />
                            <NavItem 
                                active={activeTab === 'support'} 
                                onClick={() => handleTabChange('support')} 
                                icon={Icons.HelpCircle} 
                                label="Support" 
                            />
                        </div>
                    </div>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 font-bold">
                            {adminUser?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{adminUser?.name || 'Administrator'}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase truncate">Super Admin</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 md:ml-72 p-0 m-0">
                <header className="h-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-[100] px-4 md:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 md:hidden"
                        >
                            <Icons.Menu className="w-6 h-6" />
                        </button>
                        
                        <div className="hidden md:flex items-center gap-2 text-sm">
                            <span className="text-slate-400 font-medium">Pages</span>
                            <Icons.ChevronRight className="w-4 h-4 text-slate-300" />
                            <span className="text-slate-900 dark:text-white font-bold capitalize">{activeTab.replace(/_/g, ' ')}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="hidden lg:flex items-center relative mr-2">
                            <Icons.Search className="absolute left-3 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search everything..." 
                                className="bg-slate-100 dark:bg-slate-900/50 border-none rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-red-500/20 transition-all dark:text-white"
                            />
                        </div>
                        
                        <div className="flex items-center gap-1 md:gap-2">
                            <HeaderAction icon={Icons.Bell} badgeCount={getBadgeCount('requests')} />
                            <HeaderAction icon={Icons.MessageSquare} />
                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 md:mx-2 hidden sm:block" />
                            <button className="p-1 rounded-full hover:ring-2 hover:ring-red-500/20 transition-all">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                                    {adminUser?.name?.charAt(0) || 'A'}
                                </div>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content View */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto scrollbar-hide">
                    {error && (
                        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Icons.AlertTriangle className="w-10 h-10 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Something went wrong</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">{error}</p>
                            <button 
                                onClick={() => { setError(null); fetchData(); }} 
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 active:scale-95"
                            >
                                Reconnect to Server
                            </button>
                        </div>
                    )}

                    {!error && (
                        <div className="max-w-[1600px] mx-auto animate-fade-in-up">
                            {activeTab === 'dashboard' && stats && (
                                <div className="space-y-10">
                                    <PageHeader title="Overview" icon={Icons.LayoutDashboard} onBack={() => {}} />
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <StatCard 
                                            title="Total Users" 
                                            value={stats.totalUsers} 
                                            icon={<Icons.Users className="w-5 h-5" />} 
                                            trend="+12.5%"
                                            onClick={() => setActiveTab('users')} 
                                        />
                                        <StatCard 
                                            title="Total Jobs" 
                                            value={stats.totalJobs} 
                                            icon={<Icons.Route className="w-5 h-5" />} 
                                            trend="+8.2%"
                                            onClick={() => setActiveTab('trips')} 
                                        />
                                        <StatCard 
                                            title="Revenue" 
                                            value={`$${stats.revenue}`} 
                                            icon={<Icons.DollarSign className="w-5 h-5" />} 
                                            trend="+24.1%"
                                            onClick={() => {}} 
                                        />
                                        <StatCard 
                                            title="Active Drivers" 
                                            value={stats.activeDrivers} 
                                            icon={<Icons.Car className="w-5 h-5" />} 
                                            trend="+3.4%"
                                            onClick={() => setActiveTab('users')} 
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                        <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">Revenue Analytics</h3>
                                                    <p className="text-sm text-slate-400 font-medium">Platform earnings performance</p>
                                                </div>
                                                <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                                    <button className="px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">7D</button>
                                                    <button className="px-3 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 text-red-600 rounded-md shadow-sm border border-slate-100 dark:border-slate-700">30D</button>
                                                    <button className="px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">1Y</button>
                                                </div>
                                            </div>
                                            <div className="h-[400px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={[ { name: 'Jan', uv: 4000, pv: 2400 }, { name: 'Feb', uv: 3000, pv: 1398 }, { name: 'Mar', uv: 2000, pv: 9800 }, { name: 'Apr', uv: 2780, pv: 3908 }, { name: 'May', uv: 1890, pv: 4800 }, { name: 'Jun', uv: 2390, pv: 3800 }, { name: 'Jul', uv: 3490, pv: 4300 }, ]}>
                                                        <defs>
                                                            <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-700/50" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                                                        <Tooltip 
                                                            contentStyle={{ 
                                                                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                                                border: 'none', 
                                                                borderRadius: '16px', 
                                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                                backdropFilter: 'blur(8px)'
                                                            }} 
                                                            itemStyle={{ color: '#ef4444', fontWeight: 800 }}
                                                            labelStyle={{ color: '#64748b', fontWeight: 700, marginBottom: '4px' }}
                                                        />
                                                        <Area type="monotone" dataKey="uv" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorRed)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-8">
                                            <div className="flex-1">
                                                <DispatchMapView drivers={users.filter(u => u.role === UserRole.DRIVER && u.status === UserStatus.ACTIVE)} jobs={jobs.filter(j => j.status === JobStatus.ACCEPTED)} />
                                            </div>
                                            <div className="bg-gradient-to-br from-red-600 to-rose-700 p-8 rounded-3xl shadow-xl shadow-red-900/20 text-white relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                                    <Icons.Shield className="w-32 h-32" />
                                                </div>
                                                <h3 className="text-2xl font-black mb-2 relative z-10">System Ready</h3>
                                                <p className="text-red-100 text-sm font-medium mb-6 relative z-10">All systems operational. Fleet tracking is active and secure.</p>
                                                <button onClick={() => setActiveTab('settings')} className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative z-10">
                                                    Manage Security
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'trips' && (
                                <div className="space-y-8">
                                    <PageHeader title="Trips Management" icon={Icons.Route} onBack={() => setActiveTab('dashboard')} />
                                    {badgeSettings && <TripsView jobs={jobs} onSelectJob={setSelectedJob} badgeSettings={badgeSettings} />}
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <div className="space-y-8">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <PageHeader title="Users Management" icon={Icons.Users} onBack={() => setActiveTab('dashboard')} />
                                        
                                        <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <FilterTab active={filterRole === 'ALL'} onClick={() => setFilterRole('ALL')} label="All Users" />
                                            <FilterTab active={filterRole === 'DRIVER'} onClick={() => setFilterRole('DRIVER')} label="Drivers" />
                                            <FilterTab active={filterRole === 'CLIENT'} onClick={() => setFilterRole('CLIENT')} label="Clients" />
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm text-left">
                                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                                    <tr>
                                                        <th className="px-8 py-5">User Identification</th>
                                                        <th className="px-8 py-5">Email Address</th>
                                                        <th className="px-8 py-5">Security Role</th>
                                                        <th className="px-8 py-5">Status</th>
                                                        <th className="px-8 py-5">Registration</th>
                                                        <th className="px-8 py-5 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                                    {users.filter(u => (filterRole === 'ALL' || u.role === filterRole) && u.email !== 'jclott77@gmail.com').length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium italic">No users found matching the current criteria.</td>
                                                        </tr>
                                                    ) : (
                                                        users
                                                            .filter(u => (filterRole === 'ALL' || u.role === filterRole) && u.email !== 'jclott77@gmail.com')
                                                            .map(u => (
                                                            <tr key={u.id || Math.random()} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors" onClick={() => setSelectedUser(u)}>
                                                                <td className="px-8 py-5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-black text-xs">
                                                                            {u.name?.charAt(0)}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-red-600 transition-colors">
                                                                                {u.name || 'Unknown User'}
                                                                            </span>
                                                                            {u?.paymentVerificationStatus === 'PENDING' && (
                                                                                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tighter">Needs Verification</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-5 text-slate-500 font-medium">{u.email || 'No Email'}</td>
                                                                <td className="px-8 py-5">
                                                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter border border-slate-200 dark:border-slate-600">
                                                                        {u.role || 'GUEST'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-5"><StatusBadge status={u.status} /></td>
                                                                <td className="px-8 py-5 text-slate-400 font-medium">{new Date(u.joinDate || Date.now()).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</td>
                                                                <td className="px-8 py-5 text-right">
                                                                    <button className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center ml-auto transition-all">
                                                                        <Icons.ChevronRight className="w-5 h-5" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'pricing' && pricingConfig && (
                                <div className="space-y-8">
                                    <PageHeader title="Trip Fares" icon={Icons.DollarSign} onBack={() => setActiveTab('dashboard')} />
                                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600">
                                                <Icons.DollarSign className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">Base Fares & Tiers</h3>
                                                <p className="text-sm text-slate-400 font-medium">Standardize your platform economy</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Platform Fee</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                    <input type="number" value={pricingConfig.baseFare} onChange={e => setPricingConfig({...pricingConfig, baseFare: parseFloat(e.target.value)})} className="w-full pl-8 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-black text-lg focus:ring-2 focus:ring-red-500/20 outline-none transition-all" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Platform Commission (%)</label>
                                                <div className="relative">
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                                    <input type="number" value={(pricingConfig.commissionRate || 0) * 100} onChange={e => setPricingConfig({...pricingConfig, commissionRate: parseFloat(e.target.value) / 100})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-black text-lg focus:ring-2 focus:ring-red-500/20 outline-none transition-all" />
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="font-black text-sm text-slate-400 uppercase tracking-[0.2em] mb-6">Tiered Distance Rates (per km)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                            {Object.keys(pricingConfig).filter(key => key.startsWith('tier')).map(key => (
                                                <div key={key} className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{key.replace('tier', 'Tier ').replace('Rate', ' Rate')}</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                        <input type="number" step="0.01" value={(pricingConfig as any)[key]} onChange={e => setPricingConfig({...pricingConfig, [key]: parseFloat(e.target.value)})} className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-bold focus:ring-2 focus:ring-red-500/20 outline-none transition-all" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <h3 className="font-black text-sm text-slate-400 uppercase tracking-[0.2em] mb-6">Vehicle Multipliers</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-10">
                                            {Object.keys(pricingConfig.multipliers).map(key => (
                                                <div key={key} className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{key}</label>
                                                    <input type="number" step="0.1" value={pricingConfig.multipliers[key]} onChange={e => setPricingConfig({...pricingConfig, multipliers: {...pricingConfig.multipliers, [key]: parseFloat(e.target.value)}})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white font-bold focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-center" />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-8 border-t border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                                            <div className="flex gap-8">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <input type="checkbox" checked={pricingConfig.enablePeakPricing} onChange={e => setPricingConfig({...pricingConfig, enablePeakPricing: e.target.checked})} className="w-5 h-5 rounded-lg border-slate-300 text-red-600 focus:ring-red-500/20 transition-all" />
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-red-600 transition-colors">Peak Hours</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <input type="checkbox" checked={pricingConfig.enableWeekendPricing} onChange={e => setPricingConfig({...pricingConfig, enableWeekendPricing: e.target.checked})} className="w-5 h-5 rounded-lg border-slate-300 text-red-600 focus:ring-red-500/20 transition-all" />
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-red-600 transition-colors">Weekend Rates</span>
                                                </label>
                                            </div>
                                            <button onClick={() => handleUpdatePricing(pricingConfig)} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2">
                                                <Icons.Save className="w-5 h-5" />
                                                Publish Pricing
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'mats' && thresholds && (
                                <MatsView thresholds={thresholds} onUpdate={handleUpdateThresholds} onBack={() => setIsSidebarOpen(true)} />
                            )}

                            {activeTab === 'support' && supportSettings && (
                                <SupportView settings={supportSettings} onUpdate={handleUpdateSupportSettings} onBack={() => setIsSidebarOpen(true)} />
                            )}
                            
                            {activeTab === 'disputes' && jobs && (
                                <div className="space-y-8">
                                    <PageHeader title="Dispute Resolution" icon={Icons.Gavel} onBack={() => setIsSidebarOpen(true)} />
                                    <DisputesView jobs={jobs} onResolve={handleResolveDispute} />
                                </div>
                            )}

                            {activeTab === 'marketing' && (
                                 <div className="space-y-8">
                                    <PageHeader title="Marketing" icon={Icons.Megaphone} onBack={() => setIsSidebarOpen(true)} />
                                    <MarketingView onUpdate={fetchData} />
                                </div>
                            )}

                            {activeTab === 'broadcast' && (
                                 <div className="space-y-8">
                                    <PageHeader title="System Broadcast" icon={Icons.Bell} onBack={() => setIsSidebarOpen(true)} />
                                    <BroadcastView />
                                </div>
                            )}
                            
                            {activeTab === 'integrations' && integrationsConfig && (
                                <div className="space-y-8 animate-fade-in">
                                    <PageHeader title="API Integrations" icon={Icons.Key} onBack={() => setActiveTab('dashboard')} />
                                    <p className="text-slate-500 dark:text-slate-400 -mt-6">Manage your third-party API keys for Maps, AI, Flight Tracking, and Payments.</p>

                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 md:p-6 space-y-6 shadow-xl overflow-hidden">
                                        
                                        {/* Admin Email */}
                                        <div className="bg-white dark:bg-slate-800/50 rounded-lg p-3 md:p-4 border border-slate-200 dark:border-slate-700">
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Primary Admin Email</label>
                                            <input 
                                                type="text" 
                                                value={integrationsConfig.primaryAdminEmail || ''} 
                                                onChange={e => setIntegrationsConfig({...integrationsConfig, primaryAdminEmail: e.target.value})} 
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none transition-colors"
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1">Only this email can access this panel.</p>
                                        </div>

                                        {/* Google Maps */}
                                        <div className="bg-white dark:bg-slate-800/50 rounded-lg p-3 md:p-4 border border-slate-200 dark:border-slate-700">
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Google Maps API Key</label>
                                            <div className="relative">
                                                <input 
                                                    type={visibleKeys['googleMaps'] ? "text" : "password"}
                                                    value={integrationsConfig.googleMapsKey} 
                                                    onChange={e => setIntegrationsConfig({...integrationsConfig, googleMapsKey: e.target.value})} 
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none transition-colors pr-10"
                                                />
                                                <button onClick={() => toggleVisibility('googleMaps')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-white">
                                                    {visibleKeys['googleMaps'] ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Google Gemini */}
                                        <div className="bg-white dark:bg-slate-800/50 rounded-lg p-3 md:p-4 border border-slate-200 dark:border-slate-700">
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Google Gemini AI Key</label>
                                            <div className="relative">
                                                <input 
                                                    type={visibleKeys['googleGemini'] ? "text" : "password"}
                                                    value={integrationsConfig.googleGeminiKey || ''} 
                                                    onChange={e => setIntegrationsConfig({...integrationsConfig, googleGeminiKey: e.target.value})} 
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none transition-colors pr-10"
                                                />
                                                <button onClick={() => toggleVisibility('googleGemini')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-white">
                                                    {visibleKeys['googleGemini'] ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* FlightAware */}
                                        <div className="bg-white dark:bg-slate-800/50 rounded-lg p-3 md:p-4 border border-slate-200 dark:border-slate-700">
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">FlightAware AeroAPI Key</label>
                                            <div className="relative">
                                                <input 
                                                    type={visibleKeys['flightAware'] ? "text" : "password"}
                                                    value={integrationsConfig.flightAwareKey || ''} 
                                                    onChange={e => setIntegrationsConfig({...integrationsConfig, flightAwareKey: e.target.value})} 
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none transition-colors pr-10"
                                                />
                                                <button onClick={() => toggleVisibility('flightAware')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-white">
                                                    {visibleKeys['flightAware'] ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Stripe */}
                                        <div className="bg-white dark:bg-slate-800/50 rounded-lg p-3 md:p-4 border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Icons.DollarSign className="w-5 h-5 text-blue-500" />
                                                <h3 className="font-bold text-slate-900 dark:text-white">Stripe Payments</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Publishable Key</label>
                                                    <div className="relative">
                                                        <input 
                                                            type={visibleKeys['stripePublic'] ? "text" : "password"}
                                                            value={integrationsConfig.stripePublishableKey} 
                                                            onChange={e => setIntegrationsConfig({...integrationsConfig, stripePublishableKey: e.target.value})} 
                                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-mono text-xs focus:border-blue-500 outline-none transition-colors pr-10"
                                                            placeholder="pk_test_..."
                                                        />
                                                        <button onClick={() => toggleVisibility('stripePublic')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-white">
                                                            {visibleKeys['stripePublic'] ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Secret Key</label>
                                                    <div className="relative">
                                                        <input 
                                                            type={visibleKeys['stripeSecret'] ? "text" : "password"}
                                                            value={integrationsConfig.stripeSecretKey} 
                                                            onChange={e => setIntegrationsConfig({...integrationsConfig, stripeSecretKey: e.target.value})} 
                                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-mono text-xs focus:border-blue-500 outline-none transition-colors pr-10"
                                                            placeholder="sk_test_..."
                                                        />
                                                        <button onClick={() => toggleVisibility('stripeSecret')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-white">
                                                            {visibleKeys['stripeSecret'] ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Twilio SMS */}
                                        <div className="bg-white dark:bg-slate-800/50 rounded-lg p-3 md:p-4 border border-slate-200 dark:border-slate-700">
                                            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Icons.MessageSquare className="w-5 h-5 text-blue-500" />
                                                    <h3 className="font-bold text-slate-900 dark:text-white">SMS Notifications (Twilio)</h3>
                                                </div>
                                                <div className="flex items-center gap-2 self-start md:self-auto">
                                                    <button className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-bold text-blue-600 dark:text-blue-400 rounded transition-colors uppercase whitespace-nowrap">Auto-Fill Credentials</button>
                                                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${integrationsConfig.twilioEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} onClick={() => setIntegrationsConfig({...integrationsConfig, twilioEnabled: !integrationsConfig.twilioEnabled})}>
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${integrationsConfig.twilioEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600 dark:text-white uppercase">{integrationsConfig.twilioEnabled ? 'Enabled' : 'Disabled'}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Admin Mobile Number (For Alerts)</label>
                                                    <input 
                                                        type="text" 
                                                        value={integrationsConfig.adminMobileNumber} 
                                                        onChange={e => setIntegrationsConfig({...integrationsConfig, adminMobileNumber: e.target.value})} 
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none transition-colors"
                                                    />
                                                    <p className="text-[10px] text-slate-500 mt-1">Receive SMS alerts when new bookings are made.</p>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">From Number / Sender ID</label>
                                                    <input 
                                                        type="text" 
                                                        value={integrationsConfig.twilioFromNumber} 
                                                        onChange={e => setIntegrationsConfig({...integrationsConfig, twilioFromNumber: e.target.value})} 
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-mono text-sm focus:border-blue-500 outline-none transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Account SID</label>
                                                    <input 
                                                        type="text" 
                                                        value={integrationsConfig.twilioAccountSid} 
                                                        onChange={e => setIntegrationsConfig({...integrationsConfig, twilioAccountSid: e.target.value})} 
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-mono text-xs focus:border-blue-500 outline-none transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Auth Token</label>
                                                    <div className="relative">
                                                        <input 
                                                            type={visibleKeys['twilioAuth'] ? "text" : "password"}
                                                            value={integrationsConfig.twilioAuthToken || ''} 
                                                            onChange={e => setIntegrationsConfig({...integrationsConfig, twilioAuthToken: e.target.value})} 
                                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white font-mono text-xs focus:border-blue-500 outline-none transition-colors pr-10"
                                                        />
                                                        <button onClick={() => toggleVisibility('twilioAuth')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-white">
                                                            {visibleKeys['twilioAuth'] ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Save Button */}
                                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-center md:justify-end relative items-center gap-4">
                                            {showIntegrationsSaved && (
                                                <div className="absolute top-[-50px] md:top-auto md:right-48 bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg animate-fade-in flex items-center gap-2 z-10 whitespace-nowrap">
                                                    <Icons.Check className="w-3 h-3" /> Changes Saved!
                                                </div>
                                            )}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleUpdateIntegrations(integrationsConfig); }} 
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-2"
                                            >
                                                <Icons.Save className="w-5 h-5" />
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {activeTab === 'settings' && badgeSettings && (
                                 <div className="space-y-8">
                                    <PageHeader title="Global Settings" icon={Icons.Settings} onBack={() => setActiveTab('dashboard')} />
                                    <SettingsView 
                                        badgeSettings={badgeSettings} 
                                        onUpdateBadges={handleUpdateBadges}
                                        brandingSettings={brandingSettings}
                                        onUpdateBranding={handleUpdateBranding}
                                    />
                                    
                                    {/* DATA CLEANUP SECTION */}
                                    <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
                                        <h3 className="text-red-600 font-bold mb-2 uppercase text-[10px] tracking-[0.2em] ml-1">Danger Zone</h3>
                                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 p-6 rounded-3xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600">
                                                    <Icons.AlertTriangle className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 dark:text-red-100 tracking-tight leading-none mb-1">Reset Database for Launch</h4>
                                                    <p className="text-sm text-slate-500 dark:text-red-200/70 font-medium">Deletes ALL non-admin users, bookings, and test data.</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setShowResetModal(true)}
                                                className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95"
                                            >
                                                Reset Data
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Modals */}
            {selectedUser && (
                <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} onUpdate={fetchData} onPayout={handleProcessPayout} />
            )}
            {selectedJob && (
                <TripDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} onUpdate={fetchData} users={users} adminUser={adminUser} />
            )}
            
            {showResetModal && (
                <ConfirmationModal
                    title="DANGER: RESET DATABASE"
                    message="This action will PERMANENTLY DELETE all drivers, clients, bookings, and chat history. Only the Admin account will remain. This action CANNOT be undone."
                    confirmText="YES, DELETE EVERYTHING"
                    cancelText="Cancel, Keep Data"
                    confirmPhrase="DELETE"
                    onConfirm={async () => {
                        await mockBackend.cleanupDatabase();
                        setShowResetModal(false);
                        alert('Database has been cleaned successfully. The system is now ready for launch.');
                        window.location.reload();
                    }}
                    onCancel={() => setShowResetModal(false)}
                />
            )}
        </div>
    );

};
