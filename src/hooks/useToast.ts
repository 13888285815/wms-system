import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (toasts: ToastItem[]) => void;
let listeners: Listener[] = [];
let toasts: ToastItem[] = [];

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

const addToast = (type: ToastType, message: string) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { id, type, message };
  toasts = [...toasts, newToast];
  emit();

  setTimeout(() => {
    removeToast(id);
  }, 3000);
};

const removeToast = (id: string) => {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
};

export function useToast() {
  const [currentToasts, setCurrentToasts] = useState<ToastItem[]>(toasts);

  useEffect(() => {
    const listener = (newToasts: ToastItem[]) => {
      setCurrentToasts(newToasts);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return {
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    warning: (msg: string) => addToast('warning', msg),
    info: (msg: string) => addToast('info', msg),
    toasts: currentToasts,
    removeToast,
  };
}
