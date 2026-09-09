import React, { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/UIComponents';

export default function PersonnelPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAllUsers(search ? `search=${encodeURIComponent(search)}` : '');
      if (res.success) setUsers(res.users || []);
    } catch (error) {
      toast.error('Failed to load personnel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleStatus = async user => {
    try {
      const nextStatus = user.status === 'active' ? 'inactive' : 'active';
      const res = await api.updateUserStatus(user.id, nextStatus);
      if (res.success) {
        setUsers(prev => prev.map(item => item.id === user.id ? { ...item, status: nextStatus } : item));
        toast.success(`User marked ${nextStatus}`);
      }
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="velora-card gradient-border-top">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Personnel Management</h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Review registered trainees and trainers and manage account access.</p>
        <form onSubmit={event => { event.preventDefault(); loadUsers(); }} style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <input className="form-control" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name, email, or department" />
          <button className="btn btn-primary" type="submit"><Search size={15} /> Search</button>
        </form>
      </div>
      <div className="velora-card">
        {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading personnel...</p> : users.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No personnel found.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map(user => (
              <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
                <Users size={18} color="var(--primary)" />
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <strong style={{ color: 'var(--text-main)' }}>{user.first_name} {user.last_name}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email} | {user.department || 'Department not set'}</div>
                </div>
                <Badge variant={user.role === 'trainer' ? 'primary' : user.role === 'admin' ? 'warning' : 'success'}>{user.role}</Badge>
                <Badge variant={user.status === 'active' ? 'success' : 'danger'}>{user.status}</Badge>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => toggleStatus(user)}>{user.status === 'active' ? 'Deactivate' : 'Activate'}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
