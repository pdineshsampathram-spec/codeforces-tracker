import React, { useState, useEffect } from 'react';
import { Users2, Plus, LogIn, Trophy, Award, ExternalLink, ShieldCheck, Copy, Check } from 'lucide-react';

export default function CohortsView({ activeHandle }) {
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortDesc, setNewCohortDesc] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchCohorts = async () => {
    try {
      const res = await fetch('/api/cohorts');
      const json = await res.json();
      if (json.success && json.data) {
        setCohorts(json.data);
        if (json.data.length > 0 && !selectedCohort) {
          setSelectedCohort(json.data[0]);
        }
      }
    } catch (err) {
      console.error('Fetch cohorts error:', err);
    }
  };

  const fetchLeaderboard = async (cohortId) => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch(`/api/cohorts/${cohortId}/leaderboard`);
      const json = await res.json();
      if (json.success && json.data) {
        setLeaderboard(json.data);
      }
    } catch (err) {
      console.error('Fetch leaderboard error:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchCohorts();
  }, []);

  useEffect(() => {
    if (selectedCohort) {
      fetchLeaderboard(selectedCohort.id);
    }
  }, [selectedCohort]);

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    if (!newCohortName.trim()) return;

    try {
      const res = await fetch('/api/cohorts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCohortName, description: newCohortDesc }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setNewCohortName('');
        setNewCohortDesc('');
        setShowCreateModal(false);
        await fetchCohorts();
        setSelectedCohort(json.data);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleJoinCohort = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setErrorMsg(null);
    try {
      const res = await fetch('/api/cohorts/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode, handle: activeHandle }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to join cohort');
      }
      setJoinCode('');
      await fetchCohorts();
      setSelectedCohort(json.data);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users2 size={22} style={{ color: 'var(--accent-blue)' }} />
            Cohorts & Practice Teams
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Join study groups, coding clubs, or DSA cohorts with shared live leaderboards.
          </p>
        </div>

        <button className="btn-primary-sm" onClick={() => setShowCreateModal(true)}>
          <Plus size={14} />
          <span>Create New Cohort</span>
        </button>
      </div>

      {errorMsg && (
        <div className="ent-card" style={{ padding: '0.85rem 1rem', marginBottom: '1rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--accent-red)', fontSize: '0.825rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Cohort Selector & Join Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="ent-card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.6rem' }}>
            Active Cohorts
          </span>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {cohorts.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCohort(c)}
                style={{
                  background: selectedCohort?.id === c.id ? 'var(--accent-blue-subtle)' : 'var(--bg-app)',
                  border: '1px solid',
                  borderColor: selectedCohort?.id === c.id ? 'var(--accent-blue)' : 'var(--border-subtle)',
                  color: selectedCohort?.id === c.id ? 'var(--accent-blue)' : 'var(--text-main)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Join by Code */}
        <div className="ent-card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.6rem' }}>
            Join Team via Code
          </span>

          <form onSubmit={handleJoinCohort} style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              type="text"
              className="cmd-input"
              placeholder="Invite code (e.g. CFPRO2026)..."
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem 0.6rem',
                fontSize: '0.8rem',
                flex: 1,
              }}
            />
            <button type="submit" className="btn-secondary-sm" disabled={!joinCode.trim()}>
              <LogIn size={13} />
              <span>Join</span>
            </button>
          </form>
        </div>
      </div>

      {/* Selected Cohort Details & Shared Leaderboard */}
      {selectedCohort && (
        <div className="ent-card">
          <div className="ent-card-header">
            <div>
              <h3 className="ent-card-title">{selectedCohort.name}</h3>
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{selectedCohort.description}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Invite Code:</span>
              <button
                className="btn-secondary-sm"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                onClick={() => copyInviteCode(selectedCohort.code)}
              >
                {copiedCode ? <Check size={12} style={{ color: 'var(--accent-green)' }} /> : <Copy size={12} />}
                <span>{selectedCohort.code}</span>
              </button>
            </div>
          </div>

          {/* Shared Leaderboard Table */}
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="ent-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Rank</th>
                  <th>Member Handle</th>
                  <th>Unique Solved</th>
                  <th>Max Solved Rating</th>
                  <th>Total Submissions</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {loadingLeaderboard ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Loading shared cohort leaderboard...
                    </td>
                  </tr>
                ) : leaderboard.length > 0 ? (
                  leaderboard.map((m, idx) => (
                    <tr key={m.handle} style={{ background: m.handle.toLowerCase() === activeHandle.toLowerCase() ? 'var(--accent-blue-subtle)' : 'transparent' }}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: idx === 0 ? 'var(--accent-amber)' : idx === 1 ? 'var(--text-muted)' : idx === 2 ? 'var(--accent-orange)' : 'var(--text-subtle)' }}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                        {m.handle} {m.handle.toLowerCase() === activeHandle.toLowerCase() && <span className="status-badge done" style={{ fontSize: '0.625rem', marginLeft: '0.3rem' }}>You</span>}
                      </td>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>{m.uniqueSolved}</strong>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>★ {m.maxRating || 'Unrated'}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {m.totalSubmissions}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
                      No members in this cohort yet. Share the invite code to invite members!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="cmd-palette-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="cmd-palette" style={{ maxWidth: '440px', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Create Practice Cohort</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Create a shared group for your university, DSA study group, or competitive programming club.
            </p>

            <form onSubmit={handleCreateCohort} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <input
                type="text"
                className="cmd-input"
                placeholder="Cohort Name (e.g. MIT CP Club 2026)..."
                value={newCohortName}
                onChange={e => setNewCohortName(e.target.value)}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-sm)' }}
                autoFocus
              />

              <textarea
                className="note-textarea"
                placeholder="Description / practice goals..."
                value={newCohortDesc}
                onChange={e => setNewCohortDesc(e.target.value)}
                rows={3}
              />

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary-sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-sm" disabled={!newCohortName.trim()}>
                  Create Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
