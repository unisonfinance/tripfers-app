
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Icons } from './Icons';
import { mockBackend } from '../services/mockBackend';

interface DevRoleSwitcherProps {
  currentUser: User | null;
  onSwitch: (userId: string) => void;
}

const ROLES_TO_SWITCH = [
    { id: '3', icon: <Icons.Shield className="w-5 h-5" />, label: 'Admin', color: 'bg-blue-600' },
    { id: '6', icon: <span className="font-bold text-sm">G</span>, label: 'GC Driver', color: 'bg-black' },
    { id: '8', icon: <span className="font-bold text-sm">S</span>, label: 'SYD Driver', color: 'bg-black' },
    { id: '9', icon: <span className="font-bold text-sm">M</span>, label: 'MEL Driver', color: 'bg-black' },
    { id: '1', icon: <Icons.User className="w-5 h-5" />, label: 'Client', color: 'bg-red-600' },
];

export const DevRoleSwitcher: React.FC<DevRoleSwitcherProps> = ({ currentUser, onSwitch }) => {
  return null;
  /*
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleGenerateJobs = async () => {
    setGenerating(true);
    await mockBackend.generateRandomJobs();
    setTimeout(() => setGenerating(false), 1000);
  };

  const handleClearJobs = async () => {
    if(confirm('Are you sure you want to delete all jobs/trips? This cannot be undone.')) {
        setClearing(true);
        await mockBackend.clearAllJobs();
        setTimeout(() => setClearing(false), 1000);
    }
  };

  return (
    <div className="fixed left-2 top-1/2 -translate-y-1/2 z-[9999] animate-fade-in">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-full p-1.5 flex flex-col gap-2">
        {ROLES_TO_SWITCH.map(role => {
          const isActive = currentUser?.id === role.id;
          return (
            <button
              key={role.id}
              onClick={() => onSwitch(role.id)}
              title={`Switch to ${role.label}`}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isActive
                  ? `${role.color} text-white shadow-md scale-110`
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              {role.icon}
            </button>
          );
        })}
        
        <div className="border-t border-slate-100 dark:border-slate-700 my-1 pt-1"></div>
        <button
            onClick={handleGenerateJobs}
            title="Generate Random Jobs (3 GC, 3 SYD, 3 MEL)"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all bg-amber-100 text-amber-600 hover:bg-amber-200 ${generating ? 'animate-spin' : ''}`}
        >
            <Icons.Plus className="w-5 h-5" />
        </button>
        <button
            onClick={handleClearJobs}
            title="Clear All Jobs (Reset)"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all bg-red-100 text-red-600 hover:bg-red-200 ${clearing ? 'animate-pulse' : ''}`}
        >
            <Icons.Minus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
  */
};
