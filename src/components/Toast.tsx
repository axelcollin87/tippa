'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 bg-black ${
              t.type === 'error'
                ? 'border-red-500/50 text-red-400'
                : t.type === 'info'
                ? 'border-zinc-800 text-zinc-200'
                : 'border-green-500/50 text-green-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {t.type === 'error' ? (
                <AlertCircle size={18} className="shrink-0 text-red-500" />
              ) : t.type === 'info' ? (
                <AlertCircle size={18} className="shrink-0 text-zinc-400" />
              ) : (
                <CheckCircle size={18} className="shrink-0 text-green-500" />
              )}
              <span className="text-sm font-bold tracking-tight leading-none">
                {t.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-zinc-500 hover:text-white p-0.5 rounded transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
