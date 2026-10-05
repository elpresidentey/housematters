'use client';

import { useEffect, useState } from 'react';

export type Toast = { id: number; message: string; type: 'info' | 'success' | 'error' };

export default function Notifications({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <Notification key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Notification({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);
  return (
    <div className={`notification notification-${toast.type}`} role="status">
      <span>{toast.message}</span>
      <button type="button" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)}>&times;</button>
    </div>
  );
}
