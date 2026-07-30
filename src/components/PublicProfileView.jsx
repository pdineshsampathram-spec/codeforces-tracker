import React, { useState, useEffect } from 'react';
import { UserCheck, Award, ExternalLink, Code2, Copy, Check, Share2, Layers } from 'lucide-react';
import SkillRadar from './SkillRadar';
import ActivityHeatmap from './ActivityHeatmap';

export default function PublicProfileView({ handle = 'pdineshsampathram' }) {
  const [profileData, setProfileData] = useState(null);
  const [aggregated, setAggregated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedBadge, setCopiedBadge] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [userRes, aggRes] = await Promise.all([
          fetch(`/api/user/${encodeURIComponent(handle)}`),
          fetch(`/api/user-aggregated/${encodeURIComponent(handle)}`).catch(() => null),
        ]);
        const userJson = await userRes.json();
        if (userJson.success && userJson.data) {
          setProfileData(userJson.data);
        }
        if (aggRes) {
          const aggJson = await aggRes.json();
          if (aggJson.success) setAggregated(aggJson.data);
        }
      } catch (err) {
        console.error('Public Profile Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [handle]);

  const badgeMarkdown = `![CodeforcesPro Stats](https://codeforces-tracker-nine.vercel.app/api/badge/${handle}.svg)`;

  const copyBadgeMarkdown = () => {
    navigator.clipboard.writeText(badgeMarkdown);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  if (loading) {
    return (
      <div className="ent-card" style={{ padding: '4rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem', width: '24px', height: '24px', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading public profile for {handle}...</p>
      </div>
    );
  }

  const user = profileData?.user;
  const submissions = profileData?.submissions || [];
  const okSubmissions = submissions.filter(s => s.verdict === 'OK');
  const uniqueSolved = new Set(okSubmissions.map(s => `${s.problem?.contestId}-${s.problem?.index}`)).size;

  return (
    <div>
      {/* Hero Card */}
      <div className="ent-card" style={{ marginBottom: '1.5rem', borderTop: '3px solid var(--accent-blue)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <img
              src={user?.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'}
              alt={handle}
              style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--border-subtle)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{user?.handle || handle}</h1>
                <span className="status-badge done">Public Profile</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {user?.rank ? user.rank.toUpperCase() : 'COMPETITIVE PROGRAMMER'} • Rating: <strong style={{ color: 'var(--accent-blue)' }}>{user?.rating || 1200}</strong> (Max: {user?.maxRating || 1200})
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a
              href={`https://codeforces.com/profile/${handle}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary-sm"
            >
              <ExternalLink size={13} />
              <span>Codeforces Profile</span>
            </a>
          </div>
        </div>
      </div>

      {/* Embeddable GitHub README Stats Badge Card */}
      <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <Share2 size={16} style={{ color: 'var(--accent-purple)' }} />
            Embeddable GitHub README Stats Badge
          </h3>
          <button className="btn-secondary-sm" onClick={copyBadgeMarkdown}>
            {copiedBadge ? <Check size={13} style={{ color: 'var(--accent-green)' }} /> : <Copy size={13} />}
            <span>{copiedBadge ? 'Copied Markdown!' : 'Copy GitHub Markdown'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.6' }}>
              Add a live SVG competitive programming statistics badge to your GitHub profile <code style={{ color: 'var(--accent-blue)' }}>README.md</code>. Auto-updates with your rating and solved counts!
            </p>
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>
              {badgeMarkdown}
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <img src={`/api/badge/${handle}.svg`} alt="CodeforcesPro Badge Preview" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
          </div>
        </div>
      </div>

      {/* Multi-Platform Telemetry */}
      {aggregated && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="ent-card">
            <div className="kpi-header">
              <span className="kpi-title">CODEFORCES SOLVED</span>
              <span className="status-badge done">Codeforces</span>
            </div>
            <div className="kpi-value">{aggregated.codeforces.uniqueSolved} Solved</div>
            <div className="kpi-subtext">Across {aggregated.codeforces.totalSubmissions} submissions</div>
          </div>

          <div className="ent-card">
            <div className="kpi-header">
              <span className="kpi-title">LEETCODE SOLVED</span>
              <span className="status-badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', borderColor: 'rgba(234, 179, 8, 0.3)' }}>LeetCode</span>
            </div>
            <div className="kpi-value">{aggregated.leetcode.totalSolved} Solved</div>
            <div className="kpi-subtext">Easy: {aggregated.leetcode.easySolved} | Med: {aggregated.leetcode.mediumSolved} | Hard: {aggregated.leetcode.hardSolved}</div>
          </div>

          <div className="ent-card">
            <div className="kpi-header">
              <span className="kpi-title">TOTAL AGGREGATED SOLVED</span>
              <span className="status-badge done">Multi-Platform</span>
            </div>
            <div className="kpi-value" style={{ color: 'var(--accent-green)' }}>{aggregated.aggregatedTotalSolved} Problems</div>
            <div className="kpi-subtext">Unified competitive programming score</div>
          </div>
        </div>
      )}

      {/* Skill Radar & Activity */}
      <SkillRadar submissions={submissions} />
      <ActivityHeatmap submissions={submissions} />
    </div>
  );
}
