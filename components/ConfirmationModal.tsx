import React, { useState } from 'react';
import { Icons } from './Icons';

interface ConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmPhrase?: string; // If provided, user must type this to enable confirm button
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmPhrase
}) => {
  const [inputValue, setInputValue] = useState('');
  const isConfirmDisabled = confirmPhrase ? inputValue !== confirmPhrase : false;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up border border-slate-100 dark:border-slate-700">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
            <Icons.AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{message}</p>
          
          {confirmPhrase && (
            <div className="mb-6 text-left">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Type <span className="text-red-600 font-mono select-none">{confirmPhrase}</span> to confirm
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none focus:border-red-500 transition-colors"
                placeholder={confirmPhrase}
                autoFocus
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isConfirmDisabled}
              className={`py-3 px-4 rounded-xl font-bold transition-all shadow-lg ${
                isConfirmDisabled 
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-red-900/20 active:scale-95'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};