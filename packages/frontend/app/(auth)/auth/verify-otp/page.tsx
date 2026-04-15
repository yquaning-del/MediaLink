'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToastStore } from '@/lib/store';
import api, { extractError, ApiResponse } from '@/lib/api';

export default function VerifyOtpPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [devMode, setDevMode] = useState(false);
  const phone = typeof window !== 'undefined' ? sessionStorage.getItem('otpPhone') ?? '' : '';

  useEffect(() => {
    const devOtp = sessionStorage.getItem('devOtp');
    if (devOtp && devOtp.length === 6) {
      setOtp(devOtp.split(''));
      setDevMode(true);
      sessionStorage.removeItem('devOtp');
    } else {
      inputRefs.current[0]?.focus();
    }
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    setOtp([...digits, ...Array(6 - digits.length).fill('')]);
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { phone, code });
      addToast({ type: 'success', title: 'Phone verified!', description: 'Your account is being activated.' });

      const role = sessionStorage.getItem('otpRole');
      sessionStorage.removeItem('otpPhone');
      sessionStorage.removeItem('otpRole');
      sessionStorage.removeItem('devOtp');

      // Applicants go to payment; employers go to login (pending KYB)
      if (role === 'applicant') {
        router.push('/auth/login?from=register&message=verify_success');
      } else {
        router.push('/auth/login?message=kyb_pending');
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Invalid OTP', description: extractError(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const { data: res } = await api.post<ApiResponse<{ devOtp?: string }>>('/auth/resend-otp', { phone });
      setResendCooldown(60);
      if (res.data?.devOtp && res.data.devOtp.length === 6) {
        setOtp(res.data.devOtp.split(''));
        setDevMode(true);
        addToast({ type: 'info', title: 'OTP resent', description: 'Development mode: OTP pre-filled.' });
      } else {
        addToast({ type: 'info', title: 'OTP resent', description: 'Check your phone for the new code.' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to resend', description: extractError(err) });
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Verify Your Phone</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to <strong>{phone || 'your phone'}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {devMode && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Development mode</strong> — OTP pre-filled. SMS was not sent (Twilio not configured).
          </div>
        )}
        <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-14 w-12 rounded-md border-2 border-input text-center text-xl font-bold focus:border-primary focus:outline-none transition-colors"
              aria-label={`OTP digit ${i + 1}`}
            />
          ))}
        </div>

        <Button onClick={handleVerify} className="w-full" size="lg" loading={loading} disabled={otp.join('').length !== 6}>
          Verify OTP
        </Button>

        <div className="text-center mt-4">
          {resendCooldown > 0 ? (
            <p className="text-sm text-muted-foreground">Resend code in {resendCooldown}s</p>
          ) : (
            <button onClick={handleResend} className="text-sm text-primary hover:underline font-medium">
              Resend OTP
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
