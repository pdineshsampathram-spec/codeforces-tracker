import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Tag, CheckCircle2, XCircle, Code2, BookOpen } from 'lucide-react';

export default function ProblemDrawer({ problemItem, onClose }) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (problemItem) {
      const savedNote = localStorage.getItem(`note_${problemItem.key}`) || '';
      setNote(savedNote);
    }
  }, [problemItem]);

  if (!problemItem) return null;

  const handleSaveNote = (e) => {
    setNote(e.target.value);
    localStorage.setItem(`note_${problemItem.key}`, e.target.value);
  };

  const problemUrl = `https://codeforces.com/contest/${problemItem.contestId}/problem/${problemItem.index}`;
  const submissionUrl = problemItem.acceptedSubmissionId
    ? `https://codeforces.com/contest/${problemItem.contestId}/submission/${problemItem.acceptedSubmissionId}`
    : '#';

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontWeight: 800, 
              color: 'var(--accent-blue)', 
              background: 'var(--accent-blue-subtle)',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              {problemItem.contestId}{problemItem.index}
            </span>

            {problemItem.rating && (
              <span style={{ 
                fontFamily: 'var(--font-mono)', 
                fontWeight: 700, 
                fontSize: '0.8rem',
                color: 'var(--accent-green)',
                background: 'var(--accent-green-subtle)',
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                ★ {problemItem.rating}
              </span>
            )}
          </div>

          <button className="btn-secondary-sm" style={{ padding: '0.35rem' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
          {problemItem.name}
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.5rem' }}>
          {problemItem.tags && problemItem.tags.map(t => (
            <span key={t} style={{
              fontSize: '0.725rem',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px'
            }}>
              <Tag size={10} style={{ marginRight: '0.25rem', display: 'inline' }} />
              {t}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <a 
            href={problemUrl} 
            target="_blank" 
            rel="noreferrer"
            className="btn-primary-sm"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <span>Open Problem Page</span>
            <ExternalLink size={14} />
          </a>

          {problemItem.acceptedSubmissionId && (
            <a 
              href={submissionUrl} 
              target="_blank" 
              rel="noreferrer"
              className="btn-secondary-sm"
              style={{ justifyContent: 'center' }}
            >
              <Code2 size={14} />
              <span>Accepted Code</span>
            </a>
          )}
        </div>

        {/* Status Box */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            PERSONAL PERFORMANCE
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-subtle)', display: 'block', fontSize: '0.75rem' }}>Status</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={14} /> Accepted
              </span>
            </div>

            <div>
              <span style={{ color: 'var(--text-subtle)', display: 'block', fontSize: '0.75rem' }}>Attempts</span>
              <span style={{ fontWeight: 700 }}>{problemItem.attemptsCount || 1} tries</span>
            </div>
          </div>
        </div>

        {/* Personal Notes */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            <BookOpen size={14} style={{ color: 'var(--accent-blue)' }} />
            <span>Personal Notes & Strategy</span>
          </div>
          <textarea
            style={{
              width: '100%',
              minHeight: '120px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              padding: '0.75rem',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
              outline: 'none',
              resize: 'vertical'
            }}
            placeholder="Write key observations, edge cases, time complexity notes..."
            value={note}
            onChange={handleSaveNote}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Notes auto-save locally to browser storage.</span>
        </div>
      </div>
    </div>
  );
}
