import React, { useState, useMemo } from 'react';
import { StickyNote, Search, Trash2, ExternalLink, Calendar, FileText, Plus } from 'lucide-react';

const NOTES_KEY = 'cf_problem_notes';

const SEED_NOTES = {
  '1944-A': {
    content: 'Key Observation: If k >= n-1, all vertices can be disconnected except 1. Minimum reachable islands = 1. Otherwise, island 1 can never be isolated, minimum reachable islands = n.',
    contestId: 1944,
    index: 'A',
    name: 'Destroying Bridges',
    rating: 800,
    tags: ['greedy', 'math'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
};

export function getNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) {
      localStorage.setItem(NOTES_KEY, JSON.stringify(SEED_NOTES));
      return SEED_NOTES;
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function setNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function getNote(problemKey) {
  return getNotes()[problemKey] || null;
}

export function saveNote(problemKey, content, problemData = {}) {
  const notes = getNotes();
  if (content.trim()) {
    notes[problemKey] = {
      content: content.trim(),
      ...problemData,
      updatedAt: new Date().toISOString(),
      createdAt: notes[problemKey]?.createdAt || new Date().toISOString(),
    };
  } else {
    delete notes[problemKey];
  }
  setNotes(notes);
  return notes;
}

export function deleteNote(problemKey) {
  const notes = getNotes();
  delete notes[problemKey];
  setNotes(notes);
  return notes;
}

export function hasNote(problemKey) {
  const notes = getNotes();
  return !!notes[problemKey];
}

// Small indicator for problem rows
export function NoteIndicator({ problemKey, size = 13 }) {
  if (!hasNote(problemKey)) return null;
  return (
    <span className="note-indicator" title="Has notes">
      <StickyNote size={size} />
    </span>
  );
}

// Inline note editor for drawers/modals
export function NoteEditor({ problemKey, problemData, onSave }) {
  const existing = getNote(problemKey);
  const [content, setContent] = useState(existing?.content || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveNote(problemKey, content, problemData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave?.();
  };

  return (
    <div className="note-editor">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <StickyNote size={12} />
          Notes
        </span>
        <button
          className="btn-secondary-sm"
          style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
          onClick={handleSave}
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
      <textarea
        className="note-textarea"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Add your notes, approach, key observations..."
        rows={4}
      />
    </div>
  );
}

// Full Notes View page
export default function NotesView() {
  const [notes, setNotesState] = useState(getNotes());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editContent, setEditContent] = useState('');

  const refreshNotes = () => setNotesState(getNotes());

  const handleDelete = (key) => {
    deleteNote(key);
    refreshNotes();
  };

  const handleStartEdit = (key, content) => {
    setEditingKey(key);
    setEditContent(content);
  };

  const handleSaveEdit = (key) => {
    const note = notes[key];
    saveNote(key, editContent, {
      name: note.name,
      contestId: note.contestId,
      index: note.index,
      rating: note.rating,
      tags: note.tags,
    });
    setEditingKey(null);
    setEditContent('');
    refreshNotes();
  };

  const filteredNotes = useMemo(() => {
    return Object.entries(notes)
      .filter(([key, note]) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          (note.name && note.name.toLowerCase().includes(q)) ||
          (note.content && note.content.toLowerCase().includes(q)) ||
          key.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b[1].updatedAt) - new Date(a[1].updatedAt));
  }, [notes, searchQuery]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <StickyNote size={22} style={{ color: 'var(--accent-blue)' }} />
          Problem Notes
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          All your problem-specific notes, approaches, and observations in one place.
        </p>
      </div>

      {/* Search */}
      <div className="ent-card" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Search size={15} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
        <input
          type="text"
          className="cmd-input"
          placeholder="Search notes by problem name or content..."
          style={{ fontSize: '0.85rem' }}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
          {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="ent-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <FileText size={32} style={{ color: 'var(--text-subtle)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.3rem' }}>No notes yet</h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Open a problem from the Problems page and add notes to start building your knowledge base.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredNotes.map(([key, note]) => (
            <div key={key} className="ent-card note-card">
              <div className="note-card-header">
                <div>
                  <a
                    href={`https://codeforces.com/problemset/problem/${note.contestId}/${note.index}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    {note.contestId}{note.index}. {note.name || key}
                    <ExternalLink size={11} style={{ opacity: 0.5 }} />
                  </a>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', alignItems: 'center' }}>
                    {note.rating && (
                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                        ★ {note.rating}
                      </span>
                    )}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={10} />
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    className="bookmark-star"
                    onClick={() => editingKey === key ? handleSaveEdit(key) : handleStartEdit(key, note.content)}
                    title={editingKey === key ? 'Save' : 'Edit'}
                  >
                    {editingKey === key
                      ? <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)', fontWeight: 600 }}>Save</span>
                      : <FileText size={13} style={{ color: 'var(--text-muted)' }} />}
                  </button>
                  <button
                    className="bookmark-star"
                    onClick={() => handleDelete(key)}
                    title="Delete"
                  >
                    <Trash2 size={13} style={{ color: 'var(--accent-red)' }} />
                  </button>
                </div>
              </div>

              {editingKey === key ? (
                <textarea
                  className="note-textarea"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={5}
                  autoFocus
                  style={{ marginTop: '0.75rem' }}
                />
              ) : (
                <div className="note-content">
                  {note.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
