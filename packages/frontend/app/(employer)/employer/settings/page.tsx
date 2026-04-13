'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { extractError } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useToastStore } from '@/lib/store';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function EmployerSettingsPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<'security' | '2fa'>('security');
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFAEnabled ?? false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [totp2FALoading, setTotp2FALoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const handleChangePassword = async (values: PasswordForm) => {
    try {
      await api.put('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      addToast({ type: 'success', title: 'Password changed successfully.' });
      reset();
    } catch (err) {
      addToast({ type: 'error', title: extractError(err) });
    }
  };

  const handleSetup2FA = async () => {
    setTotp2FALoading(true);
    try {
      const { data } = await api.post('/auth/2fa/setup');
      setQrCode(data.data.qrCode);
    } catch (err) {
      addToast({ type: 'error', title: extractError(err) });
    } finally { setTotp2FALoading(false); }
  };

  const handleVerify2FA = async () => {
    setTotp2FALoading(true);
    try {
      await api.post('/auth/2fa/verify', { token: totpCode });
      setTwoFAEnabled(true);
      setQrCode(null);
      setTotpCode('');
      addToast({ type: 'success', title: '2FA enabled.' });
    } catch (err) {
      addToast({ type: 'error', title: extractError(err) });
    } finally { setTotp2FALoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Account Settings</h1>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-6">
        {([{ id: 'security', label: 'Password' }, { id: '2fa', label: 'Two-Factor Auth' }] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === tab.id ? 'bg-white text-[#1B4F72] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Change Password</h2>
          <form onSubmit={handleSubmit(handleChangePassword)} className="space-y-4">
            {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                </label>
                <input
                  type="password"
                  {...register(field)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F72]/30"
                />
                {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]?.message}</p>}
              </div>
            ))}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1B4F72] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-[#2E86C1] transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {activeTab === '2fa' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Two-Factor Authentication</h2>
              <p className="text-sm text-slate-500 mt-1">Secure your employer account with TOTP 2FA.</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${twoFAEnabled ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {twoFAEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {!twoFAEnabled && !qrCode && (
            <button
              onClick={handleSetup2FA}
              disabled={totp2FALoading}
              className="bg-[#1B4F72] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#2E86C1] transition-colors disabled:opacity-60"
            >
              {totp2FALoading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          )}

          {qrCode && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Scan this QR code with your authenticator app:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="2FA QR Code" className="border border-slate-200 rounded-lg p-2 w-48 h-48" />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Verification code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={handleVerify2FA}
                    disabled={totp2FALoading || totpCode.length < 6}
                    className="bg-[#1B4F72] text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
