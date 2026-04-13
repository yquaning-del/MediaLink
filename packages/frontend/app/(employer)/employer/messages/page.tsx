'use client';

import { useEffect, useState, useRef } from 'react';
import api, { extractError } from '@/lib/api';
import { MOCK_EMPLOYER_MESSAGES } from '@/lib/demo';

interface Message {
  id: string;
  senderId: string;
  subject?: string;
  body: string;
  read: boolean;
  sentAt: string;
  sender: { id: string; applicantProfile?: { fullName: string }; mediaHouse?: { companyName: string } };
}

export default function EmployerMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/messages/inbox').then(({ data }) => setMessages(data.data ?? [])).catch(() => setMessages(MOCK_EMPLOYER_MESSAGES)).finally(() => setLoading(false));
  }, []);

  const handleSelect = async (msg: Message) => {
    setSelected(msg);
    if (!msg.read) {
      await api.patch(`/messages/${msg.id}/read`).catch(() => {});
      setMessages((ms) => ms.map((m) => m.id === msg.id ? { ...m, read: true } : m));
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    setError('');
    try {
      await api.post('/messages', {
        recipientId: selected.senderId,
        subject: `Re: ${selected.subject ?? '(no subject)'}`,
        body: reply,
      });
      setReply('');
      setComposing(false);
    } catch (err) {
      setError(extractError(err));
    } finally { setSending(false); }
  };

  const senderName = (msg: Message) =>
    msg.sender?.applicantProfile?.fullName ?? msg.sender?.mediaHouse?.companyName ?? 'Unknown';

  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Inbox */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-white">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Inbox {unread > 0 && <span className="text-xs bg-[#1B4F72] text-white px-1.5 py-0.5 rounded-full ml-1">{unread}</span>}</h2>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1B4F72]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">No messages yet</div>
        ) : (
          <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
            {messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => handleSelect(msg)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selected?.id === msg.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm truncate ${msg.read ? 'text-slate-700' : 'font-bold text-slate-900'}`}>
                    {senderName(msg)}
                  </p>
                  {!msg.read && <span className="w-2 h-2 bg-[#1B4F72] rounded-full flex-shrink-0 mt-1" />}
                </div>
                {msg.subject && <p className="text-xs text-slate-500 truncate mt-0.5">{msg.subject}</p>}
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(msg.sentAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message detail */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {selected ? (
          <>
            <div className="bg-white border-b border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 text-lg">{selected.subject ?? '(no subject)'}</h3>
              <p className="text-sm text-slate-500 mt-1">
                From: <span className="font-medium text-slate-700">{senderName(selected)}</span> · {new Date(selected.sentAt).toLocaleString('en-GH')}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="bg-white rounded-xl border border-slate-200 p-5 whitespace-pre-wrap text-sm text-slate-800 leading-relaxed">
                {selected.body}
              </div>
            </div>
            <div className="bg-white border-t border-slate-200 p-4">
              {composing ? (
                <div className="space-y-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                    placeholder="Write a reply..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F72]/30 resize-none"
                  />
                  {error && <p className="text-red-500 text-xs">{error}</p>}
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setComposing(false); setReply(''); }} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
                    <button
                      onClick={handleSendReply}
                      disabled={sending || !reply.trim()}
                      className="bg-[#1B4F72] text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-60"
                    >
                      {sending ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setComposing(true)}
                  className="text-sm font-semibold text-[#1B4F72] hover:underline"
                >
                  ↩ Reply
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a message to read
          </div>
        )}
      </div>
    </div>
  );
}
