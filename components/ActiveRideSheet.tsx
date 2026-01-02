import React, { useState, useEffect } from 'react';
import { Job, User, JobStatus } from '../types';
import { Icons } from './Icons';
import { Skeleton } from './Skeleton';

interface ActiveRideSheetProps {
    job: Job;
    driver: User | null;
    onCall: () => void;
    onMessage: () => void;
}

export const ActiveRideSheet: React.FC<ActiveRideSheetProps> = ({ job, driver, onCall, onMessage }) => {
    const [progress, setProgress] = useState(10);
    const [eta, setEta] = useState(15); // Simulated minutes

    // Simulate ETA progress
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => (prev < 90 ? prev + 1 : prev));
            if (Math.random() > 0.8) setEta(prev => Math.max(1, prev - 1));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const getStatusTitle = (status: JobStatus) => {
        switch (status) {
            case JobStatus.DRIVER_EN_ROUTE: return 'Driver is on the way';
            case JobStatus.DRIVER_ARRIVED: return 'Driver has arrived';
            case JobStatus.IN_PROGRESS: return 'Heading to destination';
            default: return 'Ride in progress';
        }
    };

    const getStatusDescription = (status: JobStatus) => {
        switch (status) {
            case JobStatus.DRIVER_EN_ROUTE: return `Arriving in ${eta} mins`;
            case JobStatus.DRIVER_ARRIVED: return 'Please meet your driver';
            case JobStatus.IN_PROGRESS: return `On trip • ${job.dropoff}`;
            default: return 'Contact driver for details';
        }
    };

    const vehicle = driver?.vehicles?.[0];
    const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : job.vehicleType;
    const plate = vehicle?.plate || '---';

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] rounded-t-3xl transition-all duration-500 animate-slide-up">
            {/* Handle Bar */}
            <div className="w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
            </div>

            <div className="p-6 pb-safe">
                {/* Status Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {getStatusTitle(job.status)}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm flex items-center gap-2 mt-1">
                            {job.status === JobStatus.DRIVER_EN_ROUTE && (
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                </span>
                            )}
                            {getStatusDescription(job.status)}
                        </p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                        {eta} min
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mb-8 overflow-hidden">
                    <div 
                        className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-1000 ease-linear relative"
                        style={{ width: `${progress}%` }}
                    >
                         <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                    </div>
                </div>

                {/* Driver & Vehicle Info */}
                <div className="flex items-center gap-4 mb-8">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-white dark:border-slate-700 shadow-lg overflow-hidden bg-slate-200">
                            {driver?.avatar ? (
                                <img src={driver.avatar} alt="Driver" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                    <Icons.User className="w-8 h-8 text-slate-400" />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-1.5 rounded flex items-center gap-0.5">
                                <Icons.Star className="w-2.5 h-2.5 fill-current stroke-none" />
                                {driver?.rating || '5.0'}
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            {driver ? driver.name : <Skeleton className="h-5 w-32 inline-block" />}
                        </h3>
                        <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span>{vehicleName}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                {plate}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button 
                            onClick={onMessage}
                            className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Icons.MessageSquare className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={onCall}
                            className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30 hover:bg-green-600 transition-all hover:scale-105 active:scale-95 animate-pulse-slow relative"
                        >
                             <span className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping-slow"></span>
                            <Icons.Phone className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
            
            <style>{`
                .pb-safe { padding-bottom: env(safe-area-inset-bottom, 24px); }
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.3); }
                    50% { transform: scale(1.05); box-shadow: 0 20px 25px -5px rgba(34, 197, 94, 0.4); }
                }
                .animate-pulse-slow { animation: pulse-slow 2s infinite; }
                .animate-ping-slow { animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
            `}</style>
        </div>
    );
};
