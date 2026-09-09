import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { User, Mail, Building, Briefcase, Save } from 'lucide-react';

export default function UserProfilePage() {
  const { user } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    department: user?.department || '',
    designation: user?.designation || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.updateProfile(formData);
      if (res.success) {
        toast.success('Profile updated successfully!');
      }
    } catch (e) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      <div className="velora-card gradient-border-top">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>User Profile & Preferences</h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Manage your MoES officer record and organizational designation.</p>

        <form onSubmit={handleSubmit}>
          <div className="grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Read-only)</label>
            <input type="email" disabled className="form-control" value={user?.email || ''} style={{ opacity: 0.6 }} />
          </div>

          <div className="form-group">
            <label className="form-label">Department / Institute</label>
            <input
              type="text"
              className="form-control"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Official Designation</label>
            <input
              type="text"
              className="form-control"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            <Save size={16} /> Save Profile Changes
          </button>
        </form>
      </div>
    </div>
  );
}
