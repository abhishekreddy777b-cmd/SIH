import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { FileText, Trash2, Plus, RefreshCw } from 'lucide-react';

export default function NotesPage() {
  const toast = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await api.getNotes();
      if (res.success) {
        setNotes(res.notes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.deleteNote(id);
      if (res.success) {
        toast.success('Study note deleted');
        setNotes(prev => prev.filter(n => n.id !== id));
      }
    } catch (e) {
      toast.error('Failed to delete note');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="velora-card gradient-border-top">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Personal Study Notebook</h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Key concepts and lesson notes recorded during your training.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="velora-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={40} color="var(--text-dim)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No study notes saved yet. Take notes inside lesson streams!</p>
        </div>
      ) : (
        <div className="grid-cols-2">
          {notes.map(note => (
            <div key={note.id} className="velora-card velora-card-interactive" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{note.title}</h3>
                  <button onClick={() => handleDelete(note.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{note.content}</p>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '1rem', display: 'block' }}>
                Saved: {new Date(note.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
