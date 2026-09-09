import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Bell, CheckCircle, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifs();
  }, []);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.markAllNotificationsRead();
      if (res.success) {
        toast.success('All notifications marked as read');
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      }
    } catch (e) {
      toast.error('Failed to update notifications');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="velora-card gradient-border-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Notifications & System Alerts</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Updates on skill gaps, recommendations, and live classroom streams.</p>
        </div>
        <button onClick={handleMarkAllRead} className="btn btn-sm btn-outline" style={{ gap: '0.35rem' }}>
          <CheckCheck size={14} /> Mark All Read
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {notifications.map(n => (
          <div key={n.id} className="velora-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: n.is_read ? 0.7 : 1, borderLeft: n.is_read ? '1px solid var(--border-color)' : '4px solid var(--primary)' }}>
            <Bell size={20} color={n.is_read ? 'var(--text-dim)' : 'var(--primary)'} />
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{n.title}</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{n.message}</p>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{new Date(n.created_at).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
