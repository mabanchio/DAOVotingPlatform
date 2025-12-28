'use client';

import { useEffect, useState } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose?: () => void;
  duration?: number;
}

export default function Notification({
  message,
  type,
  onClose,
  duration = 5000
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration === 0) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const baseStyles = 'fixed top-6 right-6 px-6 py-4 rounded-lg border flex items-center gap-3 backdrop-blur-sm max-w-md z-50 animate-in fade-in slide-in-from-right-4 duration-300';

  const typeStyles = {
    success: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
    error: 'bg-red-500/20 border-red-500/50 text-red-300',
    warning: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-300'
  };

  const iconMap = {
    success: (
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  };

  return (
    <div className={`${baseStyles} ${typeStyles[type]}`}>
      {iconMap[type]}
      <p className="font-medium text-sm">{message}</p>
      <button
        onClick={() => setIsVisible(false)}
        className="ml-auto flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Hook para mostrar notificaciones
 */
export function useNotification() {
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  const show = (message: string, type: NotificationType = 'info', duration = 5000) => {
    setNotification({ message, type, duration, onClose: () => setNotification(null) });
  };

  const showSuccess = (message: string, duration?: number) => show(message, 'success', duration);
  const showError = (message: string, duration?: number) => show(message, 'error', duration);
  const showWarning = (message: string, duration?: number) => show(message, 'warning', duration);
  const showInfo = (message: string, duration?: number) => show(message, 'info', duration);

  return {
    notification,
    show,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hide: () => setNotification(null)
  };
}
