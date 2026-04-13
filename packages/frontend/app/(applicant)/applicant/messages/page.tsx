'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api, { extractError } from '@/lib/api';
import { MOCK_APPLICANT_MESSAGES } from '@/lib/demo';
import { useToastStore } from '@/lib/store';
import { formatDateTime, getInitials } from '@/lib/utils';
import { MessageSquare, Send, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  body: string;
  subject?: string;
  read: boolean;
  sentAt: string;
  sender: { id: string; email: string; applicantProfile?: { fullName: string }; mediaHouse?: { companyName: string } };
}

export default function MessagesPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/messages/inbox');
      setMessages(data.data ?? []);
    } catch { setMessages(MOCK_APPLICANT_MESSAGES); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadMessages(); }, []);

  const openMessage = async (msg: Message) => {
    setSelected(msg);
    if (!msg.read) {
      await api.patch(`/messages/${msg.id}/read`).catch(() => {});
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, read: true } : m));
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      // Look up recipient by email (simplified — real app would have a search UI)
      await api.post('/messages', { recipientEmail, subject, body });
      addToast({ type: 'success', title: 'Message sent!' });
      setComposeOpen(false);
      setRecipientEmail(''); setSubject(''); setBody('');
    } catch (err) {
      addToast({ type: 'error', title: 'Send failed', description: extractError(err) });
    } finally { setSending(false); }
  };

  const getSenderName = (msg: Message) =>
    msg.sender?.applicantProfile?.fullName ?? msg.sender?.mediaHouse?.companyName ?? msg.sender?.email ?? 'Unknown';

  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Messages {unread > 0 && <Badge className="text-xs">{unread}</Badge>}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{messages.length} message{messages.length !== 1 ? 's' : ''} in your inbox</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadMessages}><RefreshCw className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => setComposeOpen(true)}><Send className="h-4 w-4 mr-1" /> Compose</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Message list */}
        <div className="lg:col-span-1 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            </div>
          ) : messages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => openMessage(msg)}
              className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-muted/50 ${selected?.id === msg.id ? 'border-primary bg-primary/5' : ''} ${!msg.read ? 'font-medium bg-blue-50 border-blue-200' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="h-7 w-7 rounded-full bg-brand/10 flex items-center justify-center text-xs font-semibold text-brand shrink-0">
                  {getInitials(getSenderName(msg))}
                </div>
                <span className="text-sm truncate flex-1">{getSenderName(msg)}</span>
                {!msg.read && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
              </div>
              {msg.subject && <p className="text-xs font-medium truncate">{msg.subject}</p>}
              <p className="text-xs text-muted-foreground truncate">{msg.body.slice(0, 60)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(msg.sentAt)}</p>
            </button>
          ))}
        </div>

        {/* Message detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center font-semibold text-brand shrink-0">
                    {getInitials(getSenderName(selected))}
                  </div>
                  <div>
                    <p className="font-semibold">{getSenderName(selected)}</p>
                    {selected.subject && <p className="text-sm font-medium">{selected.subject}</p>}
                    <p className="text-xs text-muted-foreground">{formatDateTime(selected.sentAt)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{selected.body}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm border rounded-lg py-16">
              Select a message to read
            </div>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Recipient Email</Label>
              <Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="employer@company.com" className="mt-1" />
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="mt-1" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message..." className="mt-1 min-h-[120px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} loading={sending} disabled={!recipientEmail || !body}><Send className="h-4 w-4 mr-1" /> Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
