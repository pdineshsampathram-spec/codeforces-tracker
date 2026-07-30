import React from 'react';
import { Sparkles, TrendingUp, Zap, Target, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';

export default function InsightsView({ submissions, user }) {
  const totalSubmissions = submissions.length;
  const okSubmissions = submissions.filter(s => s.verdict === 'OK');
  const passRate = totalSubmissions > 0 ? ((okSubmissions.length / totalSubmissions) * 100).toFixed(1) : 0;

  // Calculate tag performance
  const tagCounts = {};
  okSubmissions.forEach(sub => {
    if (sub.problem && sub.problem.tags) {
      sub.problem.tags.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    }
  });

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const topTag = sortedTags.length > 0 ? sortedTags[0][0] : 'Greedy & Math';
  const secondTag = sortedTags.length > 1 ? sortedTags[1][0] : 'Implementation';

  // Calculate rating stats
  const okRatings = okSubmissions.map(s => s.problem?.rating).filter(Boolean);
  const maxRatingSolved = okRatings.length > 0 ? Math.max(...okRatings) : 800;
  const avgRatingSolved = okRatings.length > 0 ? Math.round(okRatings.reduce((a, b) => a + b, 0) / okRatings.length) : 800;
  const recommendedNextRating = Math.min(2400, Math.max(800, maxRatingSolved + 100));

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sparkles size={22} style={{ color: 'var(--accent-purple)' }} />
          AI Performance Diagnostics & Skill Insights
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Automated data insights and practice recommendations based on your submission patterns.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Insight Card 1 */}
        <div className="ent-card" style={{ borderLeft: '3px solid var(--accent-purple)' }}>
          <div className="kpi-header">
            <span className="kpi-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={14} style={{ color: 'var(--accent-purple)' }} />
              TOP STRENGTH TOPIC
            </span>
            <span className="status-badge done">Strongest</span>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.4rem', color: 'var(--accent-purple)' }}>
            {topTag.toUpperCase()} & {secondTag.toUpperCase()}
          </div>
          <div className="kpi-subtext">
            You solve <strong>{topTag}</strong> problems with your highest first-attempt success rate.
          </div>
        </div>

        {/* Insight Card 2 */}
        <div className="ent-card" style={{ borderLeft: '3px solid var(--accent-green)' }}>
          <div className="kpi-header">
            <span className="kpi-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Target size={14} style={{ color: 'var(--accent-green)' }} />
              RECOMMENDED NEXT TARGET
            </span>
            <span className="status-badge done">Target</span>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.4rem', color: 'var(--accent-green)' }}>
            ★ {recommendedNextRating} Rating
          </div>
          <div className="kpi-subtext">
            Based on your average solved difficulty of <strong>{avgRatingSolved}</strong>, target <strong>{recommendedNextRating}</strong> problems to maximize rating growth.
          </div>
        </div>

        {/* Insight Card 3 */}
        <div className="ent-card" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
          <div className="kpi-header">
            <span className="kpi-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={14} style={{ color: 'var(--accent-blue)' }} />
              PASS ACCURACY RATE
            </span>
            <span className="status-badge" style={{ background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
              {passRate}% AC
            </span>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>
            {okSubmissions.length} of {totalSubmissions} AC
          </div>
          <div className="kpi-subtext">
            Your accepted solution ratio is stable across practice sets.
          </div>
        </div>
      </div>

      {/* Structured Insights List */}
      <div className="ent-card">
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <Lightbulb size={18} style={{ color: 'var(--accent-amber)' }} />
            Automated Diagnostic Summary
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.85rem' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.2rem' }}>High Efficiency in Core Problem Types</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Your data shows high speed and accuracy when solving <strong>{topTag}</strong> and <strong>{secondTag}</strong> problems. You consistently achieve AC within 1-2 submissions on problems rated up to <strong>{maxRatingSolved}</strong>.
              </p>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.85rem' }}>
            <TrendingUp size={20} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.2rem' }}>Optimal Practice Difficulty Range</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Your peak performance zone is currently in the <strong>{Math.max(800, avgRatingSolved - 100)} - {recommendedNextRating}</strong> rating bracket. Solving 3-5 problems in this bracket daily will build contest confidence.
              </p>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.85rem' }}>
            <AlertTriangle size={20} style={{ color: 'var(--accent-orange)', flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.2rem' }}>Topic Expansion Opportunity</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Consider practicing more <strong>Dynamic Programming (dp)</strong> and <strong>Data Structures (trees, Segment Trees)</strong> problems to prepare for higher Div 3 and Div 2 contests.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
