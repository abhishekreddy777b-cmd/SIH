import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Badge } from '../components/common/UIComponents';
import { ShieldCheck, CheckCircle2, Award, Building, Calendar, User, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function CertificateVerifyPage() {
  const { certId } = useParams();
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyCert();
  }, [certId]);

  const verifyCert = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyCertificate(certId);
      if (res.success) {
        setCertData(res.certificate);
      } else {
        setError('Certificate record not found in central MoES Registry');
      }
    } catch (e) {
      setError('Invalid or fake certificate credential ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '2rem auto', width: '100%', padding: '0 1rem' }}>
      <Link to="/" className="btn btn-sm btn-secondary" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={14} /> Back to Portal
      </Link>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Verifying cryptographic checksum on central registry...
        </div>
      ) : error ? (
        <div className="velora-card" style={{ borderLeft: '4px solid var(--danger)', textAlign: 'center', padding: '2.5rem' }}>
          <AlertTriangle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Verification Failed</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{error}</p>
        </div>
      ) : (
        <div className="velora-card gradient-border-top" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid var(--success)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--success)',
            marginBottom: '1rem'
          }}>
            <ShieldCheck size={36} />
          </div>

          <Badge variant="success" style={{ fontSize: '0.8125rem', padding: '0.35rem 0.875rem', marginBottom: '1rem' }}>
            AUTHENTIC MOES CREDENTIAL VERIFIED
          </Badge>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Certificate of Completion
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
            This certifies that the recipient successfully fulfilled all curriculum & assessment requirements.
          </p>

          <div style={{ backgroundColor: 'var(--surface-deep)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-color)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Recipient Name:</span>
              <strong style={{ color: 'var(--text-main)' }}>{certData.recipient_name}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Course Completed:</span>
              <strong style={{ color: 'var(--secondary)' }}>{certData.course_title}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Issuing Authority:</span>
              <strong style={{ color: 'var(--text-main)' }}>Ministry of Earth Sciences (MoES) / IMD</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Certificate Number:</span>
              <code style={{ color: 'var(--accent)', fontWeight: 700 }}>{certData.certificate_number}</code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Date Issued:</span>
              <strong style={{ color: 'var(--text-main)' }}>{new Date(certData.issue_date).toLocaleDateString()}</strong>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Digitally signed & recorded in MoES Capacity Building National Registry.
          </div>
        </div>
      )}
    </div>
  );
}
