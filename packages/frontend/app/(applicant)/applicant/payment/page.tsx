'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, useToastStore } from '@/lib/store';
import api, { extractError } from '@/lib/api';
import { openPaystackModal } from '@/lib/paystack';
import { CheckCircle, CreditCard, Shield, AlertCircle } from 'lucide-react';

export default function RegistrationPaymentPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if already paid (account ACTIVE means paid)
  useEffect(() => {
    if (user?.status === 'ACTIVE') {
      router.replace('/applicant/dashboard');
    } else {
      setChecking(false);
    }
  }, [user, router]);

  const handlePay = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.post('/payments/registration/initiate');
      const { authorizationUrl, reference, amount } = data.data;

      await openPaystackModal({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: user.email,
        amount,
        currency: 'GHS',
        ref: reference,
        label: 'MediaLink Ghana — Registration Fee',
        callback: async (response) => {
          // Paystack calls callback on success; backend webhook activates account
          addToast({ type: 'success', title: 'Payment successful!', description: 'Your account is being activated. Redirecting...' });
          // Poll or just redirect — webhook will have activated account
          await new Promise((r) => setTimeout(r, 2000));
          router.push('/applicant/profile/build');
        },
        onClose: () => {
          addToast({ type: 'info', title: 'Payment cancelled', description: 'Your account is still pending payment.' });
          setLoading(false);
        },
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Payment initiation failed', description: extractError(err) });
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-8 text-center">
        <div className="h-16 w-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="h-8 w-8 text-brand" />
        </div>
        <h1 className="text-2xl font-bold">Complete Your Registration</h1>
        <p className="text-muted-foreground mt-2">
          One final step — pay the one-time registration fee to activate your account and start applying for jobs.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Registration Fee</CardTitle>
          <CardDescription>One-time, non-refundable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-sm">MediaLink Ghana Registration</span>
            <span className="font-bold text-lg">GHC 50.00</span>
          </div>
          <div className="mt-4 space-y-2">
            {[
              'Full access to your applicant profile',
              'AI-powered job matching alerts',
              'Apply to unlimited job listings',
              'In-platform messaging with employers',
              'Application tracking dashboard',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-md p-3 mb-6 text-sm text-blue-800">
        <Shield className="h-4 w-4 mt-0.5 shrink-0" />
        <span>Payments are processed securely by Paystack. We accept Mobile Money (MTN, Vodafone, AirtelTigo) and debit/credit cards.</span>
      </div>

      <Button onClick={handlePay} className="w-full" size="xl" loading={loading}>
        Pay GHC 50 with Paystack
      </Button>

      <p className="text-center text-xs text-muted-foreground mt-3">
        By paying, you agree to our{' '}
        <a href="/terms" className="underline">Terms of Service</a>.
      </p>
    </div>
  );
}
