import React, { useState } from 'react';
import { Search, Trophy, ExternalLink, Tag, Check, Filter } from 'lucide-react';
import ProblemDrawer from './ProblemDrawer';
import { BookmarkStar } from './BookmarksView';
import { NoteIndicator } from './NotesView';

export default function SolvedProblems({ submissions }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState('ALL');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [activeProblem, setActiveProblem] = useState(null);

  const solvedProblemsMap = new Map();
  const allTags = new Set();
  const allRatings = new Set();

  const sortedSubmissions = [...submissions].sort((a, b) => a.creationTimeSeconds - b.creationTimeSeconds);

  sortedSubmissions.forEach(sub => {
    if (!sub.problem || !sub.problem.contestId || !sub.problem.index) return;
    const key = `${sub.problem.contestId}-${sub.problem.index}`;

    if (!solvedProblemsMap.has(key)) {
      solvedProblemsMap.set(key, {
        key,
        contestId: sub.problem.contestId,
        index: sub.problem.index,
        name: sub.problem.name,
        rating: sub.problem.rating || null,
        tags: sub.problem.tags || [],
        solvedTimeSeconds: null,
        acceptedSubmissionId: null,
        language: sub.programmingLanguage,
        attemptsCount: 0,
        isSolved: false
      });
    }

    const item = solvedProblemsMap.get(key);
    item.attemptsCount += 1;

    if (sub.verdict === 'OK' && !item.isSolved) {
      item.isSolved = true;
      item.solvedTimeSeconds = sub.creationTimeSeconds;
      item.acceptedSubmissionId = sub.id;
      item.language = sub.programmingLanguage;
    }
  });

  let solvedList = Array.from(solvedProblemsMap.values()).filter(p => p.isSolved);

  solvedList.forEach(p => {
    if (p.rating) allRatings.add(p.rating);
    p.tags.forEach(t => allTags.add(t));
  });

  const sortedRatingsList = Array.from(allRatings).sort((a, b) => a - b);
  const sortedTagsList = Array.from(allTags).sort();

  const filteredList = solvedList.filter(p => {
    const fullCode = `${p.contestId}${p.index}`.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          fullCode.includes(searchTerm.toLowerCase());
    
    const matchesRating = selectedRating === 'ALL' || (p.rating && p.rating.toString() === selectedRating);
    const matchesTag = selectedTag === 'ALL' || p.tags.includes(selectedTag);

    return matchesSearch && matchesRating && matchesTag;
  });

  filteredList.sort((a, b) => {
    if (sortBy === 'newest') return b.solvedTimeSeconds - a.solvedTimeSeconds;
    if (sortBy === 'oldest') return a.solvedTimeSeconds - b.solvedTimeSeconds;
    if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'rating-asc') return (a.rating || 0) - (b.rating || 0);
    return 0;
  });

  return (
    <div>
      <div className="ent-card" style={{ padding: 0 }}>
        <div className="ent-card-header" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="ent-card-title">
            <Trophy size={18} style={{ color: 'var(--accent-green)' }} />
            Solved Problems Explorer
          </h3>
          <span className="status-badge done">
            {solvedList.length} Unique Solved
          </span>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem', background: 'rgba(255, 255, 255, 0.01)', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              className="cmd-input"
              style={{ 
                background: 'var(--bg-app)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                fontSize: '0.825rem'
              }}
              placeholder="Filter by problem name or code (Destroying Bridges, 1944A)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', padding: '0.45rem 0.75rem', fontSize: '0.825rem', outline: 'none' }}
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
          >
            <option value="ALL">All Rating Levels</option>
            {sortedRatingsList.map(r => (
              <option key={r} value={r.toString()}>{r} Rating</option>
            ))}
          </select>

          <select 
            style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', padding: '0.45rem 0.75rem', fontSize: '0.825rem', outline: 'none' }}
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            <option value="ALL">All Topic Tags</option>
            {sortedTagsList.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          <select 
            style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', padding: '0.45rem 0.75rem', fontSize: '0.825rem', outline: 'none' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Recently Solved</option>
            <option value="oldest">Sort: Earliest Solved</option>
            <option value="rating-desc">Sort: Difficulty (High-Low)</option>
            <option value="rating-asc">Sort: Difficulty (Low-High)</option>
          </select>
        </div>

        {/* Enterprise Data Table */}
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="ent-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}></th>
                <th>Code</th>
                <th>Problem Name</th>
                <th>Rating</th>
                <th>Tags</th>
                <th>Attempts</th>
                <th>Solve Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length > 0 ? (
                filteredList.map(p => {
                  const solvedDate = new Date(p.solvedTimeSeconds * 1000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <tr key={p.key} style={{ cursor: 'pointer' }} onClick={() => setActiveProblem(p)}>
                      <td onClick={e => e.stopPropagation()} style={{ padding: '0.5rem' }}>
                        <BookmarkStar
                          problemKey={p.key}
                          problemData={{ contestId: p.contestId, index: p.index, name: p.name, rating: p.rating, tags: p.tags }}
                          size={14}
                        />
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)' }}>
                        {p.contestId}{p.index}
                        <NoteIndicator problemKey={p.key} size={11} />
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {p.name}
                      </td>
                      <td>
                        {p.rating ? (
                          <span style={{ 
                            fontFamily: 'var(--font-mono)', 
                            fontWeight: 600, 
                            color: 'var(--accent-green)',
                            background: 'var(--accent-green-subtle)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem'
                          }}>
                            {p.rating}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {p.tags.slice(0, 3).map(tag => (
                            <span key={tag} style={{
                              fontSize: '0.7rem',
                              color: 'var(--text-muted)',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid var(--border-subtle)',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px'
                            }}>{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {p.attemptsCount} {p.attemptsCount === 1 ? 'try' : 'tries'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {solvedDate}
                      </td>
                      <td>
                        <button className="btn-secondary-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-subtle)' }}>
                    No solved problems match search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Detail Drawer */}
      <ProblemDrawer problemItem={activeProblem} onClose={() => setActiveProblem(null)} />
    </div>
  );
}
