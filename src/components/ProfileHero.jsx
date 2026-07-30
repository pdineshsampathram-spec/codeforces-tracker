import React from 'react';
import { ExternalLink, Award, Calendar, Users, ThumbsUp, ShieldCheck } from 'lucide-react';

export function getRankColor(rank) {
  if (!rank) return '#a1a1aa';
  const r = rank.toLowerCase();
  if (r.includes('newbie')) return '#a1a1aa';
  if (r.includes('pupil')) return '#22c55e';
  if (r.includes('specialist')) return '#3b82f6';
  if (r.includes('expert')) return '#3b82f6';
  if (r.includes('candidate master')) return '#a855f7';
  if (r.includes('master')) return '#f97316';
  if (r.includes('grandmaster')) return '#ef4444';
  return '#a1a1aa';
}

export default function ProfileHero({ user }) {
  if (!user) return null;

  const rank = user.rank || 'Unrated';
  const maxRank = user.maxRank || 'Unrated';
  const rankColor = getRankColor(rank);
  const maxRankColor = getRankColor(maxRank);

  const avatar = user.titlePhoto && !user.titlePhoto.includes('no-title') ? user.titlePhoto : user.avatar;
  const regDate = new Date(user.registrationTimeSeconds * 1000).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="ent-card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
        
        {/* Left: Avatar & Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img
            src={avatar}
            alt={user.handle}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--border-subtle)'
            }}
            onError={(e) => { e.target.src = 'https://userpic.codeforces.org/no-avatar.jpg'; }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                {user.handle}
              </h1>
              <span className="status-badge" style={{ borderColor: rankColor, color: rankColor, background: 'rgba(255, 255, 255, 0.04)', textTransform: 'capitalize' }}>
                {rank}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              <span>Max Rank: <strong style={{ color: maxRankColor }}>{maxRank}</strong></span>
              <span>Contribution: <strong>{user.contribution > 0 ? `+${user.contribution}` : user.contribution}</strong></span>
              <span>Friends: <strong>{user.friendOfCount || 0}</strong></span>
              <span>Joined: <strong>{regDate}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Rating Stat Displays & Codeforces Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1.25rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
              Current Rating
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: rankColor }}>
              {user.rating ?? 'Unrated'}
            </span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1.25rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
              Max Rating
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: maxRankColor }}>
              {user.maxRating ?? 'Unrated'}
            </span>
          </div>

          <a
            href={`https://codeforces.com/profile/${user.handle}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary-sm"
            style={{ padding: '0.65rem 1rem' }}
          >
            <span>View Profile</span>
            <ExternalLink size={14} />
          </a>
        </div>

      </div>
    </div>
  );
}
