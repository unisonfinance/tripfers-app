import React, { useEffect } from 'react';
import { Icons } from './Icons';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    
    const handleDocumentClick = (e: MouseEvent) => {
        // If click is outside this component (handled by refs if needed, but here "outside" means anywhere else)
        // Actually, user said "click outside the pop-up", so clicking the popup itself shouldn't necessarily close it?
        // Or maybe just clicking anywhere. Let's assume clicking anywhere on the screen should dismiss it to be safe and responsive.
        onClose();
    };

    // Add delay to avoid immediate closing from the trigger click
    setTimeout(() => {
        document.addEventListener('click', handleDocumentClick);
    }, 100);

    return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleDocumentClick);
    };
  }, [onClose]);

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-slate-800'
  };

  return (
    <div className={`fixed bottom-24 md:bottom-6 right-6 z-[100] ${colors[type]} text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up`}>
      {type === 'success' && <Icons.Check className="w-5 h-5" />}
      {type === 'error' && <Icons.X className="w-5 h-5" />}
      {type === 'info' && <Icons.Bell className="w-5 h-5" />}
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};