'use client';

import { useToastStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colours = {
  success: 'bg-green-50 border-green-200 text-green-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
};

const iconColours = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={cn('flex items-start gap-3 p-4 rounded-lg border shadow-md', colours[toast.type])}
            role="alert"
          >
            <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', iconColours[toast.type])} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description && <p className="text-sm mt-0.5 opacity-90">{toast.description}</p>}
            </div>
            <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
