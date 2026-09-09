import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Send, UserPlus } from 'lucide-react';

export default function MessagingPage() {
  const toast = useToast();
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
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
      const contactsRes = await api.getMessageContacts();
      if (res.success) {
        const existing = res.conversations || [];
        setConversations(existing);
        setContacts(contactsRes.contacts || []);
        if (existing.length > 0) {
          loadThread(existing[0].user);
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
      const res = await api.sendMessage({ receiver_id: activePartner.id, content: newMsg });
      if (res.success) {
        if (res.message) setThreadMessages(prev => [...prev, res.message]);
        setNewMsg('');
      }
    } catch (e) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const newContacts = contacts.filter(contact => !conversations.some(conv => conv.user?.id === contact.id));

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
          {conversations.map(conv => conv.user).map(partner => (
            <div
              key={partner.id}
              onClick={() => loadThread(partner)}
              style={{
                padding: '0.625rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: activePartner?.id === partner.id ? 'var(--primary-light)' : 'transparent',
                cursor: 'pointer',
                border: activePartner?.id === partner.id ? '1px solid var(--primary)' : '1px solid transparent'
              }}
            >
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{partner.first_name} {partner.last_name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>{partner.role}</div>
            </div>
          ))}
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '0.75rem' }}>People you can message</span>
          {newContacts.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>No eligible contacts found.</div>
          ) : newContacts.map(partner => (
            <button
              type="button"
              key={`contact-${partner.id}`}
              onClick={() => loadThread(partner)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem', borderRadius: 'var(--radius-md)', backgroundColor: activePartner?.id === partner.id ? 'var(--primary-light)' : 'transparent', border: activePartner?.id === partner.id ? '1px solid var(--primary)' : '1px solid transparent', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left' }}
            >
              <UserPlus size={14} color="var(--primary)" />
              <span>
                <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700 }}>{partner.first_name} {partner.last_name}</span>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--secondary)' }}>{partner.role}</span>
              </span>
            </button>
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
                {threadMessages.filter(Boolean).map(m => (
                  <div key={m.id} style={{
                    alignSelf: m.sender_id === activePartner.id ? 'flex-start' : 'flex-end',
                    backgroundColor: m.sender_id === activePartner.id ? '#0f172a' : 'var(--primary-hover)',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    maxWidth: '70%',
                    fontSize: '0.85rem',
                    color: 'var(--text-main)'
                  }}>
                    {m.content}
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
