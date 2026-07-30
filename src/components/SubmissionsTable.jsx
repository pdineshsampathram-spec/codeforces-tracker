import React, { useState } from 'react';
import { ExternalLink, Search, Filter, Check, X, Clock, AlertTriangle } from 'lucide-react';
import { BookmarkStar } from './BookmarksView';

export default function SubmissionsTable({ submissions }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('ALL');
  const [langFilter, setLangFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const languages = Array.from(new Set(submissions.map(s => s.programmingLanguage))).filter(Boolean);

  const filteredSubmissions = submissions.filter(sub => {
    const pName = sub.problem ? (sub.problem.name || '').toLowerCase() : '';
    const pIndex = sub.problem ? (sub.problem.index || '').toLowerCase() : '';
    const matchesSearch = pName.includes(searchTerm.toLowerCase()) || 
                          pIndex.includes(searchTerm.toLowerCase()) || 
                          sub.id.toString().includes(searchTerm);

    const matchesVerdict = verdictFilter === 'ALL' || sub.verdict === verdictFilter;
    const matchesLang = langFilter === 'ALL' || sub.programmingLanguage === langFilter;

    return matchesSearch && matchesVerdict && matchesLang;
  });

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const currentItems = filteredSubmissions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderStatusBadge = (verdict) => {
    if (verdict === 'OK') {
      return (
        <span className="status-badge done">
          <Check size={11} /> Accepted
        </span>
      );
    }
    if (verdict === 'WRONG_ANSWER') {
      return (
        <span className="status-badge failed">
          <X size={11} /> Wrong Answer
        </span>
      );
    }
    if (verdict === 'TIME_LIMIT_EXCEEDED') {
      return (
        <span className="status-badge warning">
          <Clock size={11} /> TLE
        </span>
      );
    }
    return (
      <span className="status-badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
        <AlertTriangle size={11} /> {verdict}
      </span>
    );
  };

  return (
    <div className="ent-card" style={{ padding: 0 }}>
      <div className="ent-card-header" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 className="ent-card-title">
          Submissions History & Execution Logs
        </h3>
        <span style={{ fontSize: '0.775rem', color: 'var(--text-subtle)' }}>
          Showing {filteredSubmissions.length} of {submissions.length} total entries
        </span>
      </div>

      {/* Filter Controls Bar */}
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
            placeholder="Search by problem name, code (1944A), or submission ID..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <select
          style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-main)',
            padding: '0.45rem 0.75rem',
            fontSize: '0.825rem',
            outline: 'none'
          }}
          value={verdictFilter}
          onChange={(e) => { setVerdictFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="ALL">All Verdicts</option>
          <option value="OK">Accepted (OK)</option>
          <option value="WRONG_ANSWER">Wrong Answer</option>
          <option value="TIME_LIMIT_EXCEEDED">Time Limit Exceeded</option>
          <option value="COMPILATION_ERROR">Compile Error</option>
        </select>

        <select
          style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-main)',
            padding: '0.45rem 0.75rem',
            fontSize: '0.825rem',
            outline: 'none'
          }}
          value={langFilter}
          onChange={(e) => { setLangFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="ALL">All Languages</option>
          {languages.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      {/* Enterprise Data Table */}
      <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
        <table className="ent-table">
          <thead>
            <tr>
              <th style={{ width: '36px' }}></th>
              <th>ID</th>
              <th>Submitted Date</th>
              <th>Problem</th>
              <th>Rating</th>
              <th>Language</th>
              <th>Verdict</th>
              <th>Time</th>
              <th>Memory</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map(sub => {
                const subDate = new Date(sub.creationTimeSeconds * 1000).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                const problemUrl = sub.problem?.contestId 
                  ? `https://codeforces.com/contest/${sub.problem.contestId}/problem/${sub.problem.index}`
                  : '#';
                
                const submissionUrl = sub.problem?.contestId
                  ? `https://codeforces.com/contest/${sub.problem.contestId}/submission/${sub.id}`
                  : '#';

                return (
                  <tr key={sub.id}>
                    <td style={{ padding: '0.5rem' }}>
                      <BookmarkStar
                        problemKey={sub.problem ? `${sub.problem.contestId}-${sub.problem.index}` : `sub-${sub.id}`}
                        problemData={{
                          contestId: sub.problem?.contestId,
                          index: sub.problem?.index,
                          name: sub.problem?.name,
                          rating: sub.problem?.rating,
                          tags: sub.problem?.tags,
                        }}
                        size={14}
                      />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.775rem', color: 'var(--text-subtle)' }}>
                      #{sub.id}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {subDate}
                    </td>
                    <td>
                      <a href={problemUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-main)', fontWeight: 600, textDecoration: 'none' }}>
                        {sub.problem?.contestId ? `${sub.problem.contestId}${sub.problem.index} - ` : ''}
                        {sub.problem?.name}
                      </a>
                    </td>
                    <td>
                      {sub.problem?.rating ? (
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-blue)' }}>
                          {sub.problem.rating}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-subtle)' }}>-</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {sub.programmingLanguage}
                    </td>
                    <td>
                      {renderStatusBadge(sub.verdict)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {sub.timeConsumedMillis} ms
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {(sub.memoryConsumedBytes / 1024).toFixed(0)} KB
                    </td>
                    <td>
                      <a href={submissionUrl} target="_blank" rel="noreferrer" className="btn-secondary-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-subtle)' }}>
                  No submissions matched your search filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            className="btn-secondary-sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn-secondary-sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
