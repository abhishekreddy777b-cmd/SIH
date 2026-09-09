import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { User, Mail, Building, Briefcase, Save, MapPin, FileText } from 'lucide-react';

const getInitialFormData = (user) => ({
  first_name: user?.first_name || '',
  last_name: user?.last_name || '',
  phone: user?.phone || '',
  department: user?.department || '',
  designation: user?.designation || '',
  location: user?.location || '',
  bio: user?.bio || '',
  qualifications: user?.profile?.qualifications || '',
  experience_years: user?.profile?.experience_years || 0,
  students_trained: user?.profile?.students_trained || 0,
  learning_hours: user?.profile?.learning_hours || 0,
  current_streak: user?.profile?.current_streak || 0,
  longest_streak: user?.profile?.longest_streak || 0
});

export default function UserProfilePage() {
  const { user } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState(getInitialFormData(user));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(getInitialFormData(user));
    }
  }, [user]);

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
    <div style={{ maxWidth: '760px', margin: '0 auto', width: '100%' }}>
      <div className="velora-card gradient-border-top">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>User Profile & Preferences</h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Manage your MoES officer record, contact details, and role-specific profile data.</p>

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

          <div className="grid-cols-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-control"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                className="form-control"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
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

          <div className="form-group">
            <label className="form-label">Biography</label>
            <textarea
              rows={4}
              className="form-control"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          {user?.role === 'trainer' && (
            <>
              <div className="form-group">
                <label className="form-label">Qualifications</label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                />
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Experience Years</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Students Trained</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.students_trained}
                    onChange={(e) => setFormData({ ...formData, students_trained: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {user?.role === 'trainee' && (
            <>
              <div className="grid-cols-3" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Learning Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-control"
                    value={formData.learning_hours}
                    onChange={(e) => setFormData({ ...formData, learning_hours: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Streak</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.current_streak}
                    onChange={(e) => setFormData({ ...formData, current_streak: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longest Streak</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.longest_streak}
                    onChange={(e) => setFormData({ ...formData, longest_streak: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary">
            <Save size={16} /> Save Profile Changes
          </button>
        </form>
      </div>
    </div>
  );
}
