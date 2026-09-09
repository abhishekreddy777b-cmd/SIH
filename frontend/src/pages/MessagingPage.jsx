import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { MessageSquare, Send, User, RefreshCw } from 'lucide-react';

export default function MessagingPage() {
  const toast = useToast();
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.getConversations();
      if (res.success) {
        setConversations(res.conversations || []);
        if (res.conversations.length > 0) {
          loadThread(res.conversations[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (partner) => {
    setActivePartner(partner);
    try {
      const res = await api.getMessageThread(partner.id);
      if (res.success) {
        setThreadMessages(res.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activePartner) return;
    setSending(true);
    try {
      const res = await api.sendMessage({ receiver_id: activePartner.id, message: newMsg });
      if (res.success) {
        setThreadMessages(prev => [...prev, res.message]);
        setNewMsg('');
      }
    } catch (e) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="velora-card gradient-border-top">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Direct Messages</h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Communicate directly with domain specialists and peer scientists.</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', height: '500px' }} className="velora-card">
        {/* CONVERSATION PARTNERS SIDEBAR */}
        <div style={{ width: '240px', borderRight: '1px solid var(--border-color)', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Conversations</span>
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => loadThread(conv)}
              style={{
                padding: '0.625rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activePartner?.id === conv.id ? 'var(--primary-light)' : 'transparent',
                cursor: 'pointer',
                border: activePartner?.id === conv.id ? '1px solid var(--primary)' : '1px solid transparent'
              }}
            >
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{conv.first_name} {conv.last_name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>{conv.role}</div>
            </div>
          ))}
        </div>

        {/* MESSAGES THREAD */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activePartner ? (
            <>
              <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Conversation with {activePartner.first_name} {activePartner.last_name}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
                {threadMessages.map(m => (
                  <div key={m.id} style={{
                    alignSelf: m.sender_id === activePartner.id ? 'flex-start' : 'flex-end',
                    backgroundColor: m.sender_id === activePartner.id ? '#0f172a' : 'var(--primary-hover)',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    maxWidth: '70%',
                    fontSize: '0.85rem',
                    color: 'var(--text-main)'
                  }}>
                    {m.message}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="form-control"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                />
                <button type="submit" disabled={sending} className="btn btn-primary">
                  <Send size={14} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>Select a conversation to start messaging.</div>
          )}
        </div>
      </div>
    </div>
  );
}
