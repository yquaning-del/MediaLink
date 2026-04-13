import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'GHC'): string {
  return `${currency} ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

/** Convert 0244xxxxxx to +233244xxxxxx for display */
export function formatGhanaPhone(phone: string): string {
  if (phone.startsWith('0')) return `+233${phone.slice(1)}`;
  if (phone.startsWith('233')) return `+${phone}`;
  return phone;
}

export function getCompletionColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-500';
}

export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    ACTIVE: 'default',
    APPROVED: 'default',
    HIRED: 'default',
    SUCCESS: 'default',
    PENDING: 'secondary',
    SHORTLISTED: 'secondary',
    INTERVIEWED: 'secondary',
    OFFER_MADE: 'secondary',
    DRAFT: 'outline',
    SUSPENDED: 'destructive',
    REJECTED: 'destructive',
    FAILED: 'destructive',
    DELETED: 'destructive',
    TERMINATED: 'destructive',
  };
  return map[status] ?? 'outline';
}
