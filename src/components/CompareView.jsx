import React, { useState, useEffect } from 'react';
import { Users2, Search, ArrowRightLeft, Award, Trophy, CheckCircle2 } from 'lucide-react';

export default function CompareView({ userHandleA, userAData }) {
  const [handleB, setHandleB] = useState('tourist');
  const [dataB, setDataB] = useState(null);
  const [loadingB, setLoadingB] = useState(false);
  const [errorB, setErrorB] = useState(null);

  const fetchUserB = async (targetHandle) => {
    setLoadingB(true);
    setErrorB(null);
    try {
      const res = await fetch(`/api/user/${encodeURIComponent(targetHandle)}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'User B not found');
      setDataB(json.data);
    } catch (e) {
      setErrorB(e.message);
    } finally {
      setLoadingB(false);
    }
  };

  useEffect(() => {
    fetchUserB(handleB);
  }, []);

  const handleSearchB = (e) => {
    e.preventDefault();
    if (handleB.trim()) fetchUserB(handleB.trim());
  };

  const userA = userAData ? userAData.user : null;
  const subsA = userAData ? userAData.submissions : [];
  const solvedCountA = new Set(subsA.filter(s => s.verdict === 'OK').map(s => `${s.problem?.contestId}-${s.problem?.index}`)).size;

  const userB = dataB ? dataB.user : null;
  const subsB = dataB ? dataB.submissions : [];
  const solvedCountB = new Set(subsB.filter(s => s.verdict === 'OK').map(s => `${s.problem?.contestId}-${s.problem?.index}`)).size;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Users2 size={22} style={{ color: 'var(--accent-blue)' }} />
          Multi-User Head-to-Head Comparison
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Compare performance metrics, rating statistics, and solved problem counts between two handles.
        </p>
      </div>

      {/* Comparison Selector */}
      <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchB} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>User 1:</span>
            <strong style={{ color: 'var(--accent-blue)', fontSize: '0.9rem' }}>{userHandleA}</strong>
          </div>

          <ArrowRightLeft size={18} style={{ color: 'var(--text-muted)' }} />

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', paddingLeft: '0.5rem' }}>User 2:</span>
            <input
              type="text"
              className="cmd-input"
              style={{ padding: '0.35rem' }}
              placeholder="Enter handle to compare (e.g. tourist, Benq)..."
              value={handleB}
              onChange={(e) => setHandleB(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary-sm" disabled={loadingB}>
            {loadingB ? 'Loading...' : 'Compare'}
          </button>
        </form>
      </div>

      {/* Side-by-side cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* User A Card */}
        <div className="ent-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
            <img 
              src={userA?.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'} 
              alt={userHandleA}
              style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid var(--accent-blue)' }}
            />
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{userHandleA}</h3>
              <span className="status-badge" style={{ background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)', textTransform: 'capitalize' }}>
                {userA?.rank || 'Unrated'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Current Rating</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{userA?.rating ?? 'Unrated'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Max Rating</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{userA?.maxRating ?? 'Unrated'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Unique Solved Problems</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>{solvedCountA}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Contribution</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{userA?.contribution ?? 0}</strong>
            </div>
          </div>
        </div>

        {/* User B Card */}
        <div className="ent-card">
          {loadingB ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading target handle comparison...
            </div>
          ) : errorB ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--accent-red)' }}>
              {errorB}
            </div>
          ) : userB ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                <img 
                  src={userB.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'} 
                  alt={userB.handle}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid var(--accent-purple)' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-purple)' }}>{userB.handle}</h3>
                  <span className="status-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple)', textTransform: 'capitalize' }}>
                    {userB.rank || 'Unrated'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Rating</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>{userB.rating ?? 'Unrated'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Max Rating</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{userB.maxRating ?? 'Unrated'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Unique Solved Problems</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>{solvedCountB}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Contribution</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{userB.contribution ?? 0}</strong>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
