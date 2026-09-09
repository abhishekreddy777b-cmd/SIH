import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Compass, User, Mail, Lock, Building, Briefcase } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'trainee',
    department: 'IMD Severe Weather Forecasting',
    designation: 'Assistant Meteorologist'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await register(formData);
      if (res && res.success) {
        toast.success('Registration successful! Welcome to VELORA.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '2rem auto', width: '100%', padding: '0 1rem' }}>
      <div className="velora-card gradient-border-top">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem'
          }}>
            <Compass size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Register Account</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Join MoES Capacity Building Portal
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid-cols-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">First Name</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Priya"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Last Name</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Nair"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="e.g. priya.nair@imd.gov.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              className="form-control"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="grid-cols-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role</label>
              <select
                className="form-control"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="trainee">Trainee / Scientist</option>
                <option value="trainer">Domain Trainer / Specialist</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-control"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Designation</label>
            <input
              type="text"
              className="form-control"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? 'Creating Profile...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Already registered? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
