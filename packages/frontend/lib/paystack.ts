declare global {
  interface Window {
    PaystackPop: {
      setup: (options: PaystackOptions) => { openIframe: () => void };
    };
  }
}

export interface PaystackOptions {
  key: string;
  email: string;
  amount: number; // in kobo (GHC × 100)
  currency?: string;
  ref?: string;
  label?: string;
  metadata?: Record<string, unknown>;
  callback: (response: { reference: string }) => void;
  onClose: () => void;
}

export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Not in browser'));
    if (window.PaystackPop) return resolve();

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack SDK'));
    document.head.appendChild(script);
  });
}

export async function openPaystackModal(options: PaystackOptions): Promise<void> {
  await loadPaystackScript();
  const handler = window.PaystackPop.setup(options);
  handler.openIframe();
}
