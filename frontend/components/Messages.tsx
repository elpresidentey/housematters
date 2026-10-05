'use client';

import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { api, getToken } from '@/lib/api';
import Modal from './Modal';

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  property_id: string | null;
  is_read: boolean;
  created_at: string;
};

type Conversation = {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_email: string;
  content: string;
  created_at: string;
  unread_count: number;
};

type MessagesResponse = { messages: Message[] };
type ConversationsResponse = { conversations: Conversation[] };
type UnreadCountResponse = { unreadCount: number };

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function Messages({
  propertyId,
  receiverId,
  onClose,
}: {
  propertyId?: string;
  receiverId?: string;
  onClose: () => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Decode JWT to get current user id
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setMe(payload.sub || payload.userId || payload.id);
    } catch { /* ignore */ }
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/messages/conversations', { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) setConversations(json.data.conversations);
    } catch { /* ignore */ }
    setLoadingConvs(false);
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Pre-select a conversation when receiverId is provided
  useEffect(() => {
    if (!receiverId) return;
    setSelectedId(receiverId);
    setNewMessage('');
    setLoadingMsgs(true);
    const token = getToken();
    if (!token) return;
    fetch(`/api/messages/conversations/${receiverId}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setMessages(json.data.messages);
        setLoadingMsgs(false);
        setTimeout(scrollToBottom, 80);
      })
      .catch(() => setLoadingMsgs(false));
  }, [receiverId, scrollToBottom]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedId || receiverId === selectedId) return;
    setNewMessage('');
    setLoadingMsgs(true);
    fetch(`/api/messages/conversations/${selectedId}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setMessages(json.data.messages);
        setLoadingMsgs(false);
        setTimeout(scrollToBottom, 80);
      })
      .catch(() => setLoadingMsgs(false));
  }, [selectedId, scrollToBottom, receiverId]);

  // Mark unread messages as read
  useEffect(() => {
    if (!selectedId || !me) return;
    const unread = messages.filter((m) => !m.is_read && m.receiver_id === me);
    unread.forEach((m) => {
      fetch(`/api/messages/${m.id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      }).catch(() => {});
    });
    if (unread.length > 0) fetchConversations();
  }, [messages, selectedId, me, fetchConversations]);

  // Poll conversations for new messages every 15s
  useEffect(() => {
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const body: Record<string, string> = {
        receiverId: selectedId!,
        message: text,
      };
      if (propertyId) body.propertyId = propertyId;
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setNewMessage('');
        setMessages((prev) => [...prev, json.data]);
        fetchConversations();
        setTimeout(scrollToBottom, 60);
      } else {
        setError(json?.error?.message || 'Failed to send');
      }
    } catch {
      setError('Network error');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as FormEvent);
    }
  }

  const selectedConv = conversations.find(
    (c) => c.other_user_id === selectedId
  );

  const s = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      minHeight: 0,
    },
    body: {
      display: 'flex',
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
    },
    sidebar: {
      width: '320px',
      minWidth: '280px',
      borderRight: '1px solid var(--line, #e5e9dd)',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    } as React.CSSProperties,
    sidebarHeader: {
      padding: '16px 18px',
      borderBottom: '1px solid var(--line, #e5e9dd)',
      fontWeight: 700,
      fontSize: 'var(--fs-body, 14px)',
      color: 'var(--ink, #0f261c)',
      background: '#fff',
    },
    convList: {
      flex: 1,
      overflowY: 'auto' as const,
      background: 'var(--paper-2, #f7f6ef)',
    },
    convItem: (active: boolean, unread: boolean) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 18px',
      cursor: 'pointer',
      borderLeft: active ? '3px solid var(--brand, #17634a)' : '3px solid transparent',
      background: active ? '#fff' : 'transparent',
      borderBottom: '1px solid var(--line, #e5e9dd)',
      transition: 'background .15s ease',
    }),
    convAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'var(--brand, #17634a)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '14px',
      flexShrink: 0,
    },
    convInfo: {
      flex: 1,
      minWidth: 0,
    },
    convName: (unread: boolean) => ({
      fontSize: '13px',
      fontWeight: unread ? 700 : 600,
      color: 'var(--ink, #0f261c)',
      marginBottom: '2px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    }),
    convPreview: (unread: boolean) => ({
      fontSize: '12px',
      color: unread ? 'var(--ink-2, #33503f)' : 'var(--ink-3, #5c6f63)',
      fontWeight: unread ? 600 : 400,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    }),
    convMeta: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-end',
      gap: '4px',
      flexShrink: 0,
    },
    convTime: (unread: boolean) => ({
      fontSize: '11px',
      color: unread ? 'var(--brand, #17634a)' : 'var(--ink-4, #8a9a8d)',
      fontWeight: unread ? 700 : 400,
    }),
    badge: {
      background: 'var(--brand, #17634a)',
      color: '#fff',
      borderRadius: '999px',
      minWidth: '20px',
      height: '20px',
      fontSize: '11px',
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 6px',
    },
    chatArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      minWidth: 0,
      background: '#fff',
    },
    chatHeader: {
      padding: '14px 20px',
      borderBottom: '1px solid var(--line, #e5e9dd)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: '#fff',
    },
    chatHeaderAvatar: {
      width: '34px',
      height: '34px',
      borderRadius: '50%',
      background: 'var(--brand, #17634a)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '13px',
    },
    chatHeaderName: {
      fontWeight: 700,
      fontSize: '15px',
      color: 'var(--ink, #0f261c)',
    },
    messagesArea: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
      background: 'var(--paper-2, #f7f6ef)',
    },
    dateLabel: {
      textAlign: 'center' as const,
      fontSize: '11px',
      fontWeight: 700,
      color: 'var(--ink-3, #5c6f63)',
      padding: '12px 0 6px',
      letterSpacing: '0.06em',
    },
    msgRow: (isMine: boolean) => ({
      display: 'flex',
      justifyContent: isMine ? 'flex-end' : 'flex-start',
      padding: '2px 0',
    }),
    msgBubble: (isMine: boolean) => ({
      maxWidth: '75%',
      padding: '10px 14px',
      borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
      background: isMine ? 'var(--brand, #17634a)' : '#fff',
      color: isMine ? '#fff' : 'var(--ink, #0f261c)',
      fontSize: '14px',
      lineHeight: 1.5,
      boxShadow: isMine ? 'none' : '0 1px 3px rgba(15,38,28,0.06)',
      border: isMine ? 'none' : '1px solid var(--line, #e5e9dd)',
      wordBreak: 'break-word' as const,
    }),
    msgTime: (isMine: boolean) => ({
      fontSize: '10px',
      color: isMine ? 'rgba(255,255,255,0.6)' : 'var(--ink-4, #8a9a8d)',
      marginTop: '4px',
      textAlign: 'right' as const,
    }),
    inputArea: {
      padding: '14px 20px',
      borderTop: '1px solid var(--line, #e5e9dd)',
      background: '#fff',
    },
    inputForm: {
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-end',
    },
    textarea: {
      flex: 1,
      resize: 'none' as const,
      border: '1px solid var(--line-strong, #d2dac9)',
      borderRadius: '12px',
      padding: '10px 14px',
      fontSize: '14px',
      fontFamily: 'inherit',
      color: 'var(--ink, #0f261c)',
      background: '#fff',
      minHeight: '42px',
      maxHeight: '120px',
      lineHeight: 1.5,
      outline: 'none',
    },
    sendBtn: {
      width: '42px',
      height: '42px',
      borderRadius: '50%',
      border: 'none',
      background: sending ? 'var(--line-strong, #d2dac9)' : 'var(--brand, #17634a)',
      color: '#fff',
      cursor: sending ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'background .15s ease, transform .15s ease',
    },
    emptyState: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      color: 'var(--ink-3, #5c6f63)',
      padding: '40px 20px',
      textAlign: 'center' as const,
    },
    emptyIcon: {
      fontSize: '40px',
      opacity: 0.3,
      lineHeight: 1,
    },
    errorText: {
      fontSize: '12px',
      color: 'var(--error-color, #C13515)',
      textAlign: 'center' as const,
      padding: '4px 0',
    },
    skeleton: {
      height: '60px',
      background: 'var(--line, #e5e9dd)',
      borderRadius: '8px',
      marginBottom: '8px',
      animation: 'pulse 1.5s ease-in-out infinite',
    },
  };

  return (
    <Modal title="Messages" onClose={onClose}>
      <div style={s.container}>
        <div style={s.body}>
          {/* Sidebar: Conversations */}
          <div style={s.sidebar}>
            <div style={s.sidebarHeader}>Conversations</div>
            <div style={s.convList}>
              {loadingConvs ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ ...s.skeleton, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </>
              ) : conversations.length === 0 ? (
                <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--ink-3, #5c6f63)', fontSize: '13px' }}>
                  No conversations yet.
                </div>
              ) : (
                conversations.map((conv) => {
                  const active = selectedId === conv.other_user_id;
                  const hasUnread = conv.unread_count > 0;
                  const initials = (conv.other_user_name || conv.other_user_email || '?')
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <div
                      key={conv.other_user_id}
                      style={s.convItem(active, hasUnread)}
                      onClick={() => {
                        setSelectedId(conv.other_user_id);
                        setError(null);
                      }}
                    >
                      <div style={s.convAvatar}>{initials || '?'}</div>
                      <div style={s.convInfo}>
                        <div style={s.convName(hasUnread)}>{conv.other_user_name || conv.other_user_email}</div>
                        <div style={s.convPreview(hasUnread)}>{conv.content}</div>
                      </div>
                      <div style={s.convMeta}>
                        <span style={s.convTime(hasUnread)}>
                          {conv.created_at ? formatTime(conv.created_at) : ''}
                        </span>
                        {hasUnread && (
                          <span style={s.badge}>
                            {conv.unread_count > 99 ? '99+' : conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat area */}
          <div style={s.chatArea}>
            {!selectedId ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon} aria-hidden="true">&#9993;</div>
                <p style={{ margin: 0, fontWeight: 600 }}>Select a conversation</p>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  Choose from your existing conversations or start a new one.
                </p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div style={s.chatHeader}>
                  <div style={s.chatHeaderAvatar}>
                    {selectedConv?.other_user_name
                      || selectedConv?.other_user_email
                      ?.split(' ')
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || '?'}
                  </div>
                  <span style={s.chatHeaderName}>{selectedConv?.other_user_name || selectedConv?.other_user_email || 'Conversation'}</span>
                </div>

                {/* Messages */}
                <div style={s.messagesArea}>
                  {loadingMsgs ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px 0' }}>
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          style={{
                            ...s.skeleton,
                            height: '40px',
                            width: i % 2 === 0 ? '65%' : '45%',
                            marginLeft: i % 2 === 0 ? 'auto' : 0,
                            marginRight: i % 2 === 0 ? 0 : 'auto',
                          }}
                        />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--ink-3, #5c6f63)', fontSize: '13px', padding: '40px 20px' }}>
                      No messages yet. Say hello!
                    </div>
                  ) : (
                    (() => {
                      let lastDate = '';
                      return messages.map((msg) => {
                        const isMine = me ? msg.sender_id === me : false;
                        const dateKey = new Date(msg.created_at).toDateString();
                        let showDate = false;
                        if (dateKey !== lastDate) {
                          showDate = true;
                          lastDate = dateKey;
                        }
                        return (
                          <div key={msg.id}>
                            {showDate && (
                              <div style={s.dateLabel}>{formatDate(msg.created_at)}</div>
                            )}
                            <div style={s.msgRow(isMine)}>
                              <div>
                                <div style={s.msgBubble(isMine)}>{msg.content}</div>
                                <div style={s.msgTime(isMine)}>
                                  {new Date(msg.created_at).toLocaleTimeString('en-NG', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={s.inputArea}>
                  {error && <p style={s.errorText}>{error}</p>}
                  <form style={s.inputForm} onSubmit={handleSend}>
                    <textarea
                      ref={inputRef}
                      style={s.textarea}
                      rows={1}
                      placeholder="Type a message…"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                      }}
                      onKeyDown={handleKeyDown}
                    />
                    <button
                      type="submit"
                      style={s.sendBtn}
                      disabled={sending || !newMessage.trim()}
                      aria-label="Send message"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2L11 13" />
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
