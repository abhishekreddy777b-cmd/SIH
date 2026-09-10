import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/UIComponents';
import {
  Video, MessageSquare, Send, CheckCircle, Users, Radio, HelpCircle, BarChart2
} from 'lucide-react';

export default function LiveClassroomPage() {
  const { id } = useParams();
  const toast = useToast();

  const [liveClasses, setLiveClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [loading, setLoading] = useState(true);

  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [selectedPollOption, setSelectedPollOption] = useState(null);

  useEffect(() => {
    fetchLiveClasses();
  }, [id]);

  const fetchLiveClasses = async () => {
    setLoading(true);
    try {
      const res = await api.getLiveClasses();
      if (res.success) {
        setLiveClasses(res.live_classes || []);
        if (id) {
          const selected = res.live_classes.find(c => c.id === parseInt(id));
          if (selected) loadClassDetails(selected.id);
        } else if (res.live_classes.length > 0) {
          loadClassDetails(res.live_classes[0].id);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load live classrooms');
    } finally {
      setLoading(false);
    }
  };

  const loadClassDetails = async (classId) => {
    try {
      const res = await api.getLiveClassById(classId);
      if (res.success) {
        setActiveClass(res.liveClass || res.live_class);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeClass) return;
    setSendingChat(true);
    try {
      const res = await api.sendChatMessage(activeClass.id, chatMessage);
      if (res.success) {
        setActiveClass(prev => ({
          ...prev,
          messages: [...(prev.messages || []), res.message || res.message_data]
        }));
        setChatMessage('');
      }
    } catch (e) {
      toast.error('Failed to send chat message');
    } finally {
      setSendingChat(false);
    }
  };

  const handleVotePoll = async (pollId, optionIdx) => {
    try {
      const res = await api.votePoll(pollId, optionIdx);
      if (res.success) {
        toast.success('Poll response recorded!');
        setSelectedPollOption(optionIdx);
        loadClassDetails(activeClass.id);
      }
    } catch (e) {
      toast.error('Failed to submit poll vote');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>Connecting to MoES Live Streaming Server...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* HEADER */}
      <div className="velora-card gradient-border-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Radio size={14} className="pulse-glow" /> MoES Interactive Live Classroom Hub
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            {activeClass?.title || 'Live Virtual Classroom'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Instructor: <strong style={{ color: 'var(--text-main)' }}>{activeClass?.trainer_name || 'Dr. Rahul Mehta'}</strong> • Attendees: 42 Active Scientists
          </p>
        </div>

        <Badge variant={activeClass?.status === 'live' ? 'danger' : 'success'}>
          {activeClass?.status === 'live' ? '● LIVE STREAM ACTIVE' : 'SCHEDULED'}
        </Badge>
      </div>

      {/* MAIN STREAMING & CHAT LAYOUT */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

        {/* LEFT COLUMN: LIVE VIDEO & POLLS */}
        <div style={{ flex: 2, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* STREAM VIDEO CONTAINER */}
          <div className="velora-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              width: '100%',
              aspectRatio: '16/9',
              backgroundColor: '#020617',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <Video size={64} color="var(--danger)" className="pulse-glow" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 700 }}>
                {activeClass?.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                High-Definition Encrypted Stream • MoES Internal Relay Node
              </p>

              <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'var(--text-main)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Radio size={12} /> LIVE 01:24:18
              </div>
            </div>
          </div>

          {/* LIVE INTERACTIVE POLL */}
          {activeClass?.polls?.map(poll => (
            <div key={poll.id} className="velora-card gradient-border-top" style={{ backgroundColor: 'var(--surface-deep)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <BarChart2 size={18} color="var(--secondary)" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Live Trainer Poll: {poll.question_text}
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {poll.options?.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleVotePoll(poll.id, optIdx)}
                    className="btn btn-secondary"
                    style={{ justifyContent: 'space-between', textAlign: 'left', fontSize: '0.8125rem' }}
                  >
                    <span>{opt}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Vote</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

        </div>

        {/* RIGHT COLUMN: REAL-TIME CHAT */}
        <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', height: '600px' }} className="velora-card">
          <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Classroom Live Discussion</h3>
          </div>

          {/* CHAT MESSAGES LIST */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeClass?.messages?.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>No messages yet. Start the conversation!</p>
            ) : (
              activeClass?.messages?.map((msg, idx) => (
                <div key={idx} style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-deep)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)' }}>
                      {msg.user_name || `${msg.first_name || ''} ${msg.last_name || ''}`.trim() || 'Officer'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', margin: 0 }}>{msg.message}</p>
                </div>
              ))
            )}
          </div>

          {/* CHAT INPUT FORM */}
          <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            <input
              type="text"
              placeholder="Ask trainer a question..."
              className="form-control"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            />
            <button type="submit" disabled={sendingChat} className="btn btn-primary btn-sm">
              <Send size={14} />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
