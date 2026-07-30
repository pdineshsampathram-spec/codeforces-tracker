import React, { useState, useMemo } from 'react';
import { Bookmark, Plus, Trash2, Edit3, Check, X, ExternalLink, Star, FolderOpen, Filter } from 'lucide-react';

const BOOKMARKS_KEY = 'cf_bookmarks';
const COLLECTIONS_KEY = 'cf_collections';

const DEFAULT_COLLECTIONS = ['To Solve', 'Review Later', 'Contest Prep'];

export function getBookmarks() {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '{}'); }
  catch { return {}; }
}

export function setBookmarks(bm) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bm));
}

export function getCollections() {
  try {
    const c = JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || 'null');
    return c || DEFAULT_COLLECTIONS;
  } catch { return DEFAULT_COLLECTIONS; }
}

export function setCollections(c) {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(c));
}

export function toggleBookmark(problemKey, problemData, collection = 'To Solve') {
  const bm = getBookmarks();
  if (bm[problemKey]) {
    delete bm[problemKey];
  } else {
    bm[problemKey] = {
      ...problemData,
      collection,
      bookmarkedAt: new Date().toISOString(),
    };
  }
  setBookmarks(bm);
  return bm;
}

export function isBookmarked(problemKey) {
  return !!getBookmarks()[problemKey];
}

// Star icon component for use in other views
export function BookmarkStar({ problemKey, problemData, onToggle, size = 15 }) {
  const [starred, setStarred] = useState(isBookmarked(problemKey));

  const handleClick = (e) => {
    e.stopPropagation();
    const newBm = toggleBookmark(problemKey, problemData);
    const nowStarred = !!newBm[problemKey];
    setStarred(nowStarred);
    onToggle?.(nowStarred);
  };

  return (
    <button
      className={`bookmark-star ${starred ? 'active' : ''}`}
      onClick={handleClick}
      title={starred ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Star size={size} fill={starred ? 'var(--accent-orange)' : 'none'} />
    </button>
  );
}

// Full Bookmarks View
export default function BookmarksView({ onNavigateToProblem }) {
  const [bookmarks, setBookmarksState] = useState(getBookmarks());
  const [collections, setCollectionsState] = useState(getCollections());
  const [activeCollection, setActiveCollection] = useState('all');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [filterRating, setFilterRating] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const refreshBookmarks = () => setBookmarksState(getBookmarks());

  const handleRemoveBookmark = (key) => {
    const bm = getBookmarks();
    delete bm[key];
    setBookmarks(bm);
    refreshBookmarks();
  };

  const handleMoveToCollection = (key, collection) => {
    const bm = getBookmarks();
    if (bm[key]) {
      bm[key].collection = collection;
      setBookmarks(bm);
      refreshBookmarks();
    }
  };

  const handleCreateCollection = () => {
    if (newCollectionName.trim() && !collections.includes(newCollectionName.trim())) {
      const updated = [...collections, newCollectionName.trim()];
      setCollections(updated);
      setCollectionsState(updated);
      setNewCollectionName('');
      setIsCreating(false);
    }
  };

  const handleDeleteCollection = (name) => {
    const updated = collections.filter(c => c !== name);
    setCollections(updated);
    setCollectionsState(updated);
    // Move bookmarks in deleted collection to default
    const bm = getBookmarks();
    Object.keys(bm).forEach(k => {
      if (bm[k].collection === name) bm[k].collection = 'To Solve';
    });
    setBookmarks(bm);
    refreshBookmarks();
    if (activeCollection === name) setActiveCollection('all');
  };

  const handleExport = () => {
    const data = JSON.stringify({ bookmarks: getBookmarks(), collections: getCollections() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cf-bookmarks.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredBookmarks = useMemo(() => {
    return Object.entries(bookmarks).filter(([key, bm]) => {
      if (activeCollection !== 'all' && bm.collection !== activeCollection) return false;
      if (filterRating && bm.rating && bm.rating !== parseInt(filterRating)) return false;
      if (filterTag && bm.tags && !bm.tags.some(t => t.toLowerCase().includes(filterTag.toLowerCase()))) return false;
      return true;
    });
  }, [bookmarks, activeCollection, filterRating, filterTag]);

  const collectionCounts = useMemo(() => {
    const counts = { all: Object.keys(bookmarks).length };
    collections.forEach(c => { counts[c] = 0; });
    Object.values(bookmarks).forEach(bm => {
      if (counts[bm.collection] !== undefined) counts[bm.collection]++;
    });
    return counts;
  }, [bookmarks, collections]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Bookmark size={22} style={{ color: 'var(--accent-orange)' }} />
          Problem Bookmarks
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Organize saved problems into collections for targeted practice.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.25rem' }}>
        {/* Collections Sidebar */}
        <div>
          <div className="ent-card" style={{ padding: '0.75rem' }}>
            <div style={{ padding: '0.4rem 0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)' }}>
                Collections
              </span>
            </div>

            <button
              className={`sidebar-item ${activeCollection === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCollection('all')}
              style={{ fontSize: '0.8rem' }}
            >
              <FolderOpen size={14} />
              <span>All Bookmarks</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                {collectionCounts.all}
              </span>
            </button>

            {collections.map(col => (
              <div key={col} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  className={`sidebar-item ${activeCollection === col ? 'active' : ''}`}
                  onClick={() => setActiveCollection(col)}
                  style={{ fontSize: '0.8rem', flex: 1 }}
                >
                  <Star size={13} fill={activeCollection === col ? 'var(--accent-orange)' : 'none'} style={{ color: 'var(--accent-orange)' }} />
                  <span>{col}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                    {collectionCounts[col] || 0}
                  </span>
                </button>
              </div>
            ))}

            {isCreating ? (
              <div style={{ display: 'flex', gap: '0.25rem', padding: '0.35rem' }}>
                <input
                  type="text"
                  className="cmd-input"
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}
                  placeholder="Name..."
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
                  autoFocus
                />
                <button className="bookmark-star" onClick={handleCreateCollection}><Check size={13} /></button>
                <button className="bookmark-star" onClick={() => setIsCreating(false)}><X size={13} /></button>
              </div>
            ) : (
              <button
                className="sidebar-item"
                onClick={() => setIsCreating(true)}
                style={{ fontSize: '0.8rem', color: 'var(--accent-blue)' }}
              >
                <Plus size={13} />
                <span>New Collection</span>
              </button>
            )}
          </div>

          <button
            className="btn-secondary-sm"
            style={{ width: '100%', marginTop: '0.75rem', justifyContent: 'center', fontSize: '0.75rem' }}
            onClick={handleExport}
          >
            Export JSON
          </button>
        </div>

        {/* Bookmarks List */}
        <div>
          {/* Filters */}
          <div className="ent-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Filter size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
            <input
              type="text"
              className="cmd-input"
              placeholder="Filter by tag..."
              style={{ fontSize: '0.8rem', maxWidth: '200px' }}
              value={filterTag}
              onChange={e => setFilterTag(e.target.value)}
            />
            <input
              type="number"
              className="cmd-input"
              placeholder="Rating..."
              style={{ fontSize: '0.8rem', maxWidth: '120px' }}
              value={filterRating}
              onChange={e => setFilterRating(e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginLeft: 'auto' }}>
              {filteredBookmarks.length} problem{filteredBookmarks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredBookmarks.length === 0 ? (
            <div className="ent-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <Bookmark size={32} style={{ color: 'var(--text-subtle)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.3rem' }}>No bookmarks yet</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Star problems from the Problems or Submissions pages to save them here.
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="ent-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Problem</th>
                    <th>Rating</th>
                    <th>Tags</th>
                    <th>Collection</th>
                    <th>Saved</th>
                    <th style={{ width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookmarks.map(([key, bm]) => (
                    <tr key={key}>
                      <td>
                        <button
                          className="bookmark-star active"
                          onClick={() => handleRemoveBookmark(key)}
                        >
                          <Star size={14} fill="var(--accent-orange)" />
                        </button>
                      </td>
                      <td>
                        <a
                          href={`https://codeforces.com/problemset/problem/${bm.contestId}/${bm.index}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          {bm.contestId}{bm.index}. {bm.name}
                          <ExternalLink size={11} style={{ opacity: 0.5 }} />
                        </a>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          {bm.rating || '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {(bm.tags || []).slice(0, 3).map(t => (
                            <span key={t} className="status-badge" style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem' }}>{t}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <select
                          value={bm.collection || 'To Solve'}
                          onChange={e => handleMoveToCollection(key, e.target.value)}
                          style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-main)',
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.4rem',
                            cursor: 'pointer',
                          }}
                        >
                          {collections.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        {new Date(bm.bookmarkedAt).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className="bookmark-star"
                          onClick={() => handleRemoveBookmark(key)}
                          title="Remove"
                        >
                          <Trash2 size={13} style={{ color: 'var(--accent-red)' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
