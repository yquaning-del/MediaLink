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
import { useToastStore } from '@/lib/store';
import api, { extractError, ApiResponse } from '@/lib/api';
import { Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^0(24|25|26|27|28|59|20|23|50|55|57)\d{7}$/, 'Enter a valid Ghana phone number (e.g. 0244000000)'),
  password: z.string().min(8, 'Minimum 8 characters').regex(/(?=.*[A-Z])(?=.*[0-9])/, 'Must contain an uppercase letter and a number'),
  confirmPassword: z.string(),
  // Applicant fields
  fullName: z.string().optional(),
  // Employer fields
  companyName: z.string().optional(),
  registrationNumber: z.string().optional(),
  industryType: z.enum(['TV', 'RADIO', 'DIGITAL', 'PRINT', 'OUTDOOR']).optional(),
  address: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const addToast = useToastStore((s) => s.addToast);

  const defaultRole = params.get('role') === 'employer' ? 'employer' : 'applicant';
  const [role, setRole] = useState<'applicant' | 'employer'>(defaultRole as 'applicant' | 'employer');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const endpoint = role === 'applicant' ? '/auth/register/applicant' : '/auth/register/employer';
      const payload = role === 'applicant'
        ? {
            email: data.email,
            phone: data.phone,
            password: data.password,
            confirmPassword: data.confirmPassword ?? '',
            fullName: data.fullName ?? '',
          }
        : {
            email: data.email,
            phone: data.phone,
            password: data.password,
            confirmPassword: data.confirmPassword ?? '',
            companyName: data.companyName ?? '',
            registrationNumber: data.registrationNumber ?? '',
            industryType: data.industryType,
            contactName: data.companyName ?? '',
            address: data.address ?? '',
          };

      const { data: res } = await api.post<ApiResponse<{ userId: string; devOtp?: string }>>(endpoint, payload);

      // Store phone for OTP page
      sessionStorage.setItem('otpPhone', data.phone);
      sessionStorage.setItem('otpRole', role);
      if (res.data?.devOtp) sessionStorage.setItem('devOtp', res.data.devOtp);

      addToast({ type: 'success', title: 'Registration successful!', description: 'We sent a 6-digit OTP to your phone.' });
      router.push('/auth/verify-otp');
    } catch (err) {
      addToast({ type: 'error', title: 'Registration failed', description: extractError(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Join Ghana&apos;s leading media sales recruitment platform</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(['applicant', 'employer'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-sm font-medium',
                role === r ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'
              )}
            >
              {r === 'applicant' ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
              {r === 'applicant' ? 'I\'m a Job Seeker' : 'I\'m an Employer'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {role === 'applicant' && (
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="Kwame Mensah" {...register('fullName')} className="mt-1" />
              {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName.message}</p>}
            </div>
          )}

          {role === 'employer' && (
            <>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" placeholder="Joy Media Group Ltd" {...register('companyName')} className="mt-1" />
                {errors.companyName && <p className="text-destructive text-xs mt-1">{errors.companyName.message}</p>}
              </div>
              <div>
                <Label htmlFor="registrationNumber">Company Registration Number</Label>
                <Input id="registrationNumber" placeholder="CS-XXXXXXXX" {...register('registrationNumber')} className="mt-1" />
                {errors.registrationNumber && <p className="text-destructive text-xs mt-1">{errors.registrationNumber.message}</p>}
              </div>
              <div>
                <Label htmlFor="address">Company Address</Label>
                <Input id="address" placeholder="123 Independence Ave, Accra" {...register('address')} className="mt-1" />
                {errors.address && <p className="text-destructive text-xs mt-1">{errors.address.message}</p>}
              </div>
              <div>
                <Label htmlFor="industryType">Industry Type</Label>
                <select id="industryType" {...register('industryType')} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select industry...</option>
                  <option value="TV">Television</option>
                  <option value="RADIO">Radio</option>
                  <option value="DIGITAL">Digital</option>
                  <option value="PRINT">Print</option>
                  <option value="OUTDOOR">Outdoor</option>
                </select>
                {errors.industryType && <p className="text-destructive text-xs mt-1">{errors.industryType.message}</p>}
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} className="mt-1" />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" placeholder="0244000000" {...register('phone')} className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">We&apos;ll send a verification OTP to this number.</p>
            {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" {...register('password')} className="mt-1" />
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" placeholder="Repeat your password" {...register('confirmPassword')} className="mt-1" />
            {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {role === 'applicant' && (
            <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-md p-3">
              A one-time registration fee of <strong>GHC 50</strong> is required to activate your applicant account. You&apos;ll be prompted to pay after verifying your phone number.
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {role === 'applicant' ? 'Create Account & Verify Phone' : 'Register Company'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
