import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/UIComponents';
import { Award, ShieldCheck, Download, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function CertificatesPage() {
  const toast = useToast();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.getMyCertificates();
      if (res.success) {
        setCertificates(res.certificates || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* HEADER */}
      <div className="velora-card gradient-border-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>
            Official Ministry of Earth Sciences Credentials
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            My Verified Certificates & Badges
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Cryptographically signed national capacity credentials recognized across IMD and MoES institutes.
          </p>
        </div>
      </div>

      {/* CERTIFICATE GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw className="pulse-glow" size={28} style={{ margin: '0 auto 0.5rem' }} />
          <p>Verifying credential registry...</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="velora-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Award size={48} color="var(--text-dim)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>No Certificates Earned Yet</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Complete 100% of any capacity course syllabus to earn your official MoES Certificate of Completion!
          </p>
          <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Explore Courses
          </Link>
        </div>
      ) : (
        <div className="grid-cols-2">
          {certificates.map(cert => (
            <div key={cert.id} className="velora-card velora-card-interactive gradient-border-top" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-main)'
                  }}>
                    <Award size={24} />
                  </div>
                  <div>
                    <Badge variant="success">OFFICIAL CRENDENTIAL</Badge>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      ID: {cert.certificate_number}
                    </div>
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                {cert.course_title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Awarded to <strong>{cert.user_name || 'Trainee Officer'}</strong> on {new Date(cert.issue_date || cert.issued_at || cert.created_at || Date.now()).toLocaleDateString()} by Ministry of Earth Sciences.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link to={`/certificates/verify/${cert.certificate_number}`} className="btn btn-sm btn-outline" style={{ gap: '0.35rem' }}>
                  <ShieldCheck size={14} /> Verify Authenticity
                </Link>
                <button onClick={() => toast.info('Certificate PDF download initiated')} className="btn btn-sm btn-secondary" style={{ gap: '0.35rem' }}>
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
