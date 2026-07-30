import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ExternalLink } from 'lucide-react';

export default function UpcomingContests() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    async function fetchContests() {
      try {
        const res = await fetch('/api/contests');
        const json = await res.json();
        if (json.success && json.data) {
          const upcoming = json.data
            .filter(c => c.phase === 'BEFORE')
            .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
            .slice(0, 6);
          setContests(upcoming);
        }
      } catch (e) {
        console.error('Error fetching contests:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchContests();
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (startTimeSeconds) => {
    const diffMs = startTimeSeconds * 1000 - now;
    if (diffMs <= 0) return 'Starts soon';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${remHours}h ${minutes}m ${seconds}s`;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) return null;
  if (contests.length === 0) return null;

  return (
    <div className="ent-card">
      <div className="ent-card-header">
        <h3 className="ent-card-title">
          <Calendar size={18} style={{ color: 'var(--accent-orange)' }} />
          Upcoming Codeforces Contests
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {contests.map(c => {
          const startDate = new Date(c.startTimeSeconds * 1000).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div 
              key={c.id} 
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  {c.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  <Clock size={13} />
                  <span>{startDate} ({(c.durationSeconds / 3600).toFixed(1)} hrs)</span>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-orange)' }}>
                  {formatCountdown(c.startTimeSeconds)}
                </span>

                <a
                  href={`https://codeforces.com/contestRegistration/${c.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary-sm"
                  style={{ fontSize: '0.775rem' }}
                >
                  <span>Register</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
