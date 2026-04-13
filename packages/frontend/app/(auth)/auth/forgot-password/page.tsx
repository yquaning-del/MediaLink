'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToastStore } from '@/lib/store';
import api, { extractError } from '@/lib/api';

const phoneSchema = z.object({
  phone: z.string().regex(/^0(24|25|26|27|28|59|20|23|50|55|57)\d{7}$/, 'Enter a valid Ghana phone number'),
});

const resetSchema = z.object({
  phone: z.string(),
  code: z.string().length(6, '6-digit OTP required'),
  newPassword: z.string().min(8, 'Minimum 8 characters').regex(/(?=.*[A-Z])(?=.*[0-9])/, 'Must contain uppercase and number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type PhoneForm = z.infer<typeof phoneSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [step, setStep] = useState<'phone' | 'reset'>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema), defaultValues: { phone } });

  const onSendOtp = async (data: PhoneForm) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { phone: data.phone });
      setPhone(data.phone);
      resetForm.setValue('phone', data.phone);
      setStep('reset');
      addToast({ type: 'success', title: 'OTP sent', description: 'Check your phone for the reset code.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to send OTP', description: extractError(err) });
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (data: ResetForm) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { phone: data.phone, code: data.code, newPassword: data.newPassword });
      addToast({ type: 'success', title: 'Password reset successful!', description: 'You can now sign in with your new password.' });
      router.push('/auth/login');
    } catch (err) {
      addToast({ type: 'error', title: 'Reset failed', description: extractError(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>
          {step === 'phone' ? 'Enter your phone number to receive a reset code.' : `Enter the code sent to ${phone}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'phone' ? (
          <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="0244000000" {...phoneForm.register('phone')} className="mt-1" />
              {phoneForm.formState.errors.phone && (
                <p className="text-destructive text-xs mt-1">{phoneForm.formState.errors.phone.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>Send Reset Code</Button>
          </form>
        ) : (
          <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
            <div>
              <Label htmlFor="code">OTP Code</Label>
              <Input id="code" type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code" {...resetForm.register('code')} className="mt-1 text-center tracking-widest text-lg" />
              {resetForm.formState.errors.code && <p className="text-destructive text-xs mt-1">{resetForm.formState.errors.code.message}</p>}
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" {...resetForm.register('newPassword')} className="mt-1" />
              {resetForm.formState.errors.newPassword && <p className="text-destructive text-xs mt-1">{resetForm.formState.errors.newPassword.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Repeat new password" {...resetForm.register('confirmPassword')} className="mt-1" />
              {resetForm.formState.errors.confirmPassword && <p className="text-destructive text-xs mt-1">{resetForm.formState.errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>Reset Password</Button>
            <button type="button" onClick={() => setStep('phone')} className="w-full text-sm text-muted-foreground hover:text-foreground text-center">
              Didn&apos;t receive a code? Go back
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/auth/login" className="text-primary font-medium hover:underline">Back to Sign In</Link>
        </p>
      </CardContent>
    </Card>
  );
}
