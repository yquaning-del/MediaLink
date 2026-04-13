'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToastStore } from '@/lib/store';
import api, { extractError } from '@/lib/api';
import { Bell, Users, Building2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  target: z.enum(['APPLICANTS', 'EMPLOYERS', 'ALL']),
  subject: z.string().min(1, 'Subject required').max(200),
  message: z.string().min(1, 'Message required').max(5000),
});

type FormData = z.infer<typeof schema>;

const TARGETS = [
  { value: 'APPLICANTS', label: 'Applicants Only', icon: Users, desc: 'All registered applicants' },
  { value: 'EMPLOYERS', label: 'Employers Only', icon: Building2, desc: 'All verified media houses' },
  { value: 'ALL', label: 'Everyone', icon: Globe, desc: 'All users on the platform' },
] as const;

export default function BroadcastPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [sending, setSending] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { target: 'APPLICANTS' },
  });

  const target = watch('target');
  const message = watch('message') ?? '';

  const onSubmit = async (data: FormData) => {
    setSending(true);
    try {
      const { data: res } = await api.post('/admin/broadcast', data);
      addToast({ type: 'success', title: 'Broadcast sent!', description: `Message sent to ${res.data?.sent ?? 'all'} recipients.` });
      reset();
    } catch (err) {
      addToast({ type: 'error', title: 'Send failed', description: extractError(err) });
    } finally { setSending(false); }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6" /> Broadcast Messaging</h1>
        <p className="text-muted-foreground text-sm mt-1">Send SMS and email notifications to users on the platform.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Select Recipients</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TARGETS.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('target', value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-sm',
                    target === value ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground text-center">{desc}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Compose Message</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Subject *</Label>
              <Input {...register('subject')} placeholder="e.g. Important Platform Update" className="mt-1" />
              {errors.subject && <p className="text-destructive text-xs mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Message * <span className="text-muted-foreground text-xs">(max 5000 characters)</span></Label>
                <span className="text-xs text-muted-foreground">{message.length}/5000</span>
              </div>
              <Textarea
                {...register('message')}
                placeholder="Write your broadcast message here. This will be sent via email and SMS (SMS limited to first 160 characters)."
                className="min-h-[200px]"
              />
              {errors.message && <p className="text-destructive text-xs mt-1">{errors.message.message}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                SMS will be truncated to 160 characters. Email will include the full message with branding.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" loading={sending} size="lg">
            <Bell className="h-4 w-4 mr-2" /> Send Broadcast
          </Button>
          <p className="text-xs text-muted-foreground">Messages are queued and sent in batches to prevent spam filters.</p>
        </div>
      </form>
    </div>
  );
}
