import React, { useEffect, useState } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function AnnouncementsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ title: '', description: '', priority: 'normal' });
  const [publishing, setPublishing] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.getAnnouncements();
      if (res.success) setAnnouncements(res.announcements || []);
    } catch (error) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const publishAnnouncement = async event => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.description.trim()) return;
    setPublishing(true);
    try {
      const res = await api.createAnnouncement(draft);
      if (res.success) {
        toast.success('Announcement published');
        setDraft({ title: '', description: '', priority: 'normal' });
        loadAnnouncements();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to publish announcement');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="velora-card gradient-border-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>MoES Announcements</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Directives and updates from the MoES directorate.</p>
        </div>
        <button type="button" className="btn btn-sm btn-outline" onClick={loadAnnouncements} title="Refresh announcements">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      {user?.role === 'admin' && (
        <div className="velora-card" style={{ borderTop: '3px solid var(--warning)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>Broadcast System-Wide MoES Announcement</h2>
          <form onSubmit={publishAnnouncement}>
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <input className="form-control" required placeholder="Announcement title" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} />
              <div>
                <label className="form-label" htmlFor="announcement-priority">Priority type</label>
                <select id="announcement-priority" className="form-control" value={draft.priority} onChange={event => setDraft({ ...draft, priority: event.target.value })}>
                  <option value="normal">Normal broadcast</option>
                  <option value="high">High directive</option>
                  <option value="urgent">Urgent operational</option>
                </select>
              </div>
            </div>
            <textarea className="form-control" required rows={3} placeholder="Write the message for MoES personnel..." value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} style={{ marginTop: '1rem' }} />
            <button type="submit" className="btn btn-primary" disabled={publishing} style={{ marginTop: '1rem' }}>{publishing ? 'Publishing...' : 'Publish announcement'}</button>
          </form>
        </div>
      )}
      {loading ? (
        <div className="velora-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="velora-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No announcements have been published.</div>
      ) : announcements.map(announcement => (
        <article key={announcement.id} className="velora-card" style={{ borderLeft: announcement.priority === 'high' || announcement.priority === 'urgent' ? '4px solid var(--warning)' : '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Bell size={20} color={announcement.priority === 'high' || announcement.priority === 'urgent' ? 'var(--warning)' : 'var(--primary)'} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{announcement.title}</h2>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{new Date(announcement.published_at || announcement.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{announcement.description}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
