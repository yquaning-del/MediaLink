'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { useToastStore } from '@/lib/store';
import api, { extractError } from '@/lib/api';
import { createDemoJwt, DEMO_USERS, type DemoRole } from '@/lib/demo';
import { AlertCircle, Info, Play } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  totpCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const ROLE_REDIRECT: Record<string, string> = {
  APPLICANT: '/applicant/dashboard',
  EMPLOYER: '/employer/dashboard',
  ADMIN: '/admin/dashboard',
  SUPER_ADMIN: '/admin/dashboard',
  FINANCE: '/admin/payments',
};

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { setAuth } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);

  const message = params.get('message');
  const from = params.get('from');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: res } = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
        totpCode: data.totpCode,
      });

      const { user, accessToken } = res.data;
      setAuth(user, accessToken);

      document.cookie = `accessToken=${accessToken}; path=/; SameSite=Lax`;
      document.cookie = `userRole=${user.role}; path=/; SameSite=Lax`;

      addToast({ type: 'success', title: `Welcome back${user.email ? `, ${user.email.split('@')[0]}` : ''}!` });

      let dest = ROLE_REDIRECT[user.role] ?? '/';
      if (from && from !== 'register') {
        try {
          const safePath = new URL(from, window.location.origin).pathname;
          if (safePath.startsWith('/')) dest = safePath;
        } catch { /* ignore malformed URLs */ }
      }
      router.push(dest);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg === '2FA_REQUIRED' || msg === 'Two-factor authentication code required') {
        setRequires2FA(true);
        addToast({ type: 'info', title: 'Enter your 2FA code below.' });
      } else {
        addToast({ type: 'error', title: 'Login failed', description: extractError(err) });
      }
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (role: DemoRole) => {
    const user = DEMO_USERS[role];
    const token = createDemoJwt(role);

    setAuth(user, token);
    document.cookie = `accessToken=${token}; path=/; SameSite=Lax`;
    document.cookie = `userRole=${role}; path=/; SameSite=Lax`;

    addToast({ type: 'success', title: `Demo login as ${role.toLowerCase()}` });
    router.push(ROLE_REDIRECT[role]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>Welcome back to MediaLink Ghana</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Contextual messages */}
        {message === 'kyb_pending' && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-sm text-blue-800">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Your company registration is pending admin verification. You&apos;ll receive an email once approved.</span>
          </div>
        )}
        {message === 'verify_success' && (
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-md p-3 mb-4 text-sm text-green-800">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Phone verified! Sign in to complete your registration and pay the GHC 50 fee.</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} className="mt-1" />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="password">Password</Label>
              <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
            </div>
            <Input id="password" type="password" placeholder="Your password" {...register('password')} />
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>

          {requires2FA && (
            <div>
              <Label htmlFor="totpCode">Authenticator Code</Label>
              <Input
                id="totpCode"
                type="text"
                inputMode="numeric"
                placeholder="6-digit code from your app"
                maxLength={6}
                {...register('totpCode')}
                className="mt-1 text-center tracking-widest text-lg"
              />
              <p className="text-xs text-muted-foreground mt-1">Check your authenticator app (Google Authenticator, Authy, etc.)</p>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {requires2FA ? 'Verify & Sign In' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-primary font-medium hover:underline">Create one</Link>
        </p>

        {/* Demo Login — remove when backend is ready */}
        <div className="mt-6 pt-6 border-t border-dashed">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Demo Access (Testing Only)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs"
              onClick={() => demoLogin('APPLICANT')}
            >
              <Play className="h-3 w-3 mr-1.5" /> Applicant
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs"
              onClick={() => demoLogin('EMPLOYER')}
            >
              <Play className="h-3 w-3 mr-1.5" /> Employer
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs"
              onClick={() => demoLogin('ADMIN')}
            >
              <Play className="h-3 w-3 mr-1.5" /> Admin
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
