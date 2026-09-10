import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Search, ShieldCheck, ShieldAlert, Users, Ban, AlertTriangle, Clock3 } from 'lucide-react';

export default function PersonnelPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [historyByUser, setHistoryByUser] = useState({});
  const [historyLoadingId, setHistoryLoadingId] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [statusReason, setStatusReason] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => fetchUsers(), searchTerm ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [roleFilter, statusFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await api.getAllUsers(params.toString());
      if (res.success) {
        setUsers(res.users || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load personnel records');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;

    const normalized = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const searchable = [
        user.first_name,
        user.last_name,
        user.email,
        user.department,
        user.designation,
        user.role
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalized);
    });
  }, [users, searchTerm]);

  const requestStatusChange = (user, nextStatus) => {
    if (nextStatus === user.status) return;

    setPendingStatus({ user, nextStatus });
    setStatusReason('');
  };

  const updateUserStatus = async () => {
    if (!pendingStatus) return;

    const { user, nextStatus } = pendingStatus;
    const reason = statusReason.trim() || 'Administrative moderation update';

    setUpdatingId(user.id);

    try {
      const res = await api.updateUserStatus(user.id, nextStatus, reason.trim() || 'Administrative moderation update');
      if (res.success) {
        toast.success(`${user.first_name || 'User'} marked as ${nextStatus}.`);
        setUsers((currentUsers) => currentUsers.map((currentUser) => (
          currentUser.id === user.id ? { ...currentUser, status: nextStatus } : currentUser
        )));
        await fetchModerationHistory(user.id);
        setPendingStatus(null);
        setStatusReason('');
      }
    } catch (e) {
      toast.error(e.message || 'Unable to update personnel status');
    } finally {
      setUpdatingId(null);
    }
  };

  const fetchModerationHistory = async (userId) => {
    if (!userId) return;

    setHistoryLoadingId(userId);
    try {
      const res = await api.getModerationHistory(userId);
      if (res.success) {
        setHistoryByUser((prev) => ({ ...prev, [userId]: res.history || [] }));
      }
    } catch (e) {
      console.error('Failed to load moderation history', e);
    } finally {
      setHistoryLoadingId(null);
    }
  };

  const statusSummary = useMemo(() => {
    return users.reduce((acc, user) => {
      acc.total += 1;
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, { total: 0, active: 0, inactive: 0, suspended: 0, flagged: 0 });
  }, [users]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>Loading personnel directory...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="velora-card gradient-border-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Directorate Registry
          </div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Personnel Management
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)' }}>
            <Users size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 700 }}>{users.length}</span>
          </div>
        </div>
      </div>

      <div className="velora-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ padding: '0.9rem', borderRadius: '12px', backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{statusSummary.total}</div>
          </div>
          <div style={{ padding: '0.9rem', borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{statusSummary.active || 0}</div>
          </div>
          <div style={{ padding: '0.9rem', borderRadius: '12px', backgroundColor: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.25)' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inactive</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{statusSummary.inactive || 0}</div>
          </div>
          <div style={{ padding: '0.9rem', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Suspended</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{statusSummary.suspended || 0}</div>
          </div>
          <div style={{ padding: '0.9rem', borderRadius: '12px', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Flagged</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{statusSummary.flagged || 0}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="form-control"
              style={{ paddingLeft: '36px' }}
              placeholder="Search personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select className="form-control" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ maxWidth: '180px' }}>
            <option value="all">All Roles</option>
            <option value="trainee">Trainees</option>
            <option value="trainer">Trainers</option>
            <option value="admin">Admins</option>
          </select>

          <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: '180px' }}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: '0.85rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Personnel</th>
                <th style={{ textAlign: 'left', padding: '0.85rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '0.85rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Department</th>
                <th style={{ textAlign: 'left', padding: '0.85rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Designation</th>
                <th style={{ textAlign: 'left', padding: '0.85rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.85rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length ? filteredUsers.map((user) => {
                const userHistory = historyByUser[user.id] || [];

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                    <td style={{ padding: '0.9rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(59,130,246,0.32), rgba(108,99,255,0.32))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-main)' }}>
                          {(user.first_name || user.email || 'U').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-main)', textTransform: 'capitalize' }}>{user.role}</td>
                    <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-muted)' }}>{user.department || '—'}</td>
                    <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-muted)' }}>{user.designation || '—'}</td>
                    <td style={{ padding: '0.9rem 0.75rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background:
                            user.status === 'active' ? 'rgba(16,185,129,0.12)' :
                            user.status === 'suspended' ? 'rgba(239,68,68,0.12)' :
                            user.status === 'flagged' ? 'rgba(245,158,11,0.12)' : 'rgba(148,163,184,0.12)',
                          color:
                            user.status === 'active' ? 'var(--success)' :
                            user.status === 'suspended' ? 'var(--danger)' :
                            user.status === 'flagged' ? 'var(--warning)' : 'var(--text-muted)'
                        }}
                      >
                        {user.status === 'active' ? <ShieldCheck size={12} /> : user.status === 'suspended' ? <Ban size={12} /> : user.status === 'flagged' ? <AlertTriangle size={12} /> : <ShieldAlert size={12} />}
                        {user.status === 'active' ? 'Active' : user.status === 'suspended' ? 'Suspended' : user.status === 'flagged' ? 'Flagged' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <select
                          className="form-control"
                          value={user.status || 'active'}
                          onChange={(e) => requestStatusChange(user, e.target.value)}
                          disabled={updatingId === user.id}
                          style={{ minWidth: '150px' }}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                          <option value="flagged">Flagged</option>
                        </select>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
                          onClick={() => fetchModerationHistory(user.id)}
                          disabled={historyLoadingId === user.id}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Clock3 size={12} />
                            {historyLoadingId === user.id ? 'Loading...' : 'Audit trail'}
                          </span>
                        </button>
                        {userHistory.length > 0 && (
                          <div style={{ marginTop: '0.25rem', padding: '0.55rem 0.65rem', borderRadius: '8px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.74rem', color: 'var(--text-main)' }}>
                            {userHistory.slice(0, 3).map((entry) => (
                              <div key={entry.id} style={{ padding: '0.25rem 0', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                                <div style={{ fontWeight: 700 }}>{entry.new_status}</div>
                                <div style={{ color: 'var(--text-muted)' }}>{entry.reason}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                                  {new Date(entry.created_at).toLocaleString()} by {entry.changed_by_first_name || 'Admin'} {entry.changed_by_last_name || ''}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                    No personnel found for this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingStatus && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-change-title"
          className="velora-card"
          style={{ border: '1px solid var(--warning)', position: 'fixed', right: '2rem', bottom: '2rem', zIndex: 20, width: 'min(420px, calc(100vw - 2rem))', boxShadow: '0 18px 45px rgba(0, 0, 0, 0.35)' }}
        >
          <h2 id="status-change-title" style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Change account status
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
            {pendingStatus.user.first_name} {pendingStatus.user.last_name} will be marked as <strong>{pendingStatus.nextStatus}</strong>.
          </p>
          <label className="form-label" htmlFor="status-reason">Reason</label>
          <textarea
            id="status-reason"
            className="form-control"
            rows={3}
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            placeholder="Enter the reason shown to the user when they sign in"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setPendingStatus(null)} disabled={Boolean(updatingId)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={updateUserStatus} disabled={Boolean(updatingId)}>
              {updatingId ? 'Saving...' : 'Save status'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
