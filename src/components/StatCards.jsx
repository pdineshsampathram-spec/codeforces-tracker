import React from 'react';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, FileCode, Target, Zap, Activity, Clock } from 'lucide-react';

export default function StatCards({ submissions }) {
  const totalSubmissions = submissions.length;

  const solvedProblemsMap = new Map();
  let okCount = 0;

  submissions.forEach(sub => {
    if (sub.verdict === 'OK') {
      okCount++;
      const key = `${sub.problem.contestId}-${sub.problem.index}`;
      if (!solvedProblemsMap.has(key)) {
        solvedProblemsMap.set(key, sub.problem);
      }
    }
  });

  const uniqueSolvedCount = solvedProblemsMap.size;
  const passRate = totalSubmissions > 0 ? ((okCount / totalSubmissions) * 100).toFixed(1) : 0;

  const ratings = Array.from(solvedProblemsMap.values())
    .map(p => p.rating)
    .filter(Boolean);

  const maxRating = ratings.length > 0 ? Math.max(...ratings) : 'N/A';
  const avgRating = ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 'N/A';

  return (
    <div className="kpi-grid">
      {/* KPI 1 */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Problems Solved</span>
          <span className="kpi-trend positive">
            <ArrowUpRight size={12} />
            +12.5%
          </span>
        </div>
        <div className="kpi-value" style={{ color: 'var(--accent-green)' }}>
          {uniqueSolvedCount}
        </div>
        <div className="kpi-subtext">
          {okCount} total accepted solutions
        </div>
      </div>

      {/* KPI 2 */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Acceptance Rate</span>
          <span className="kpi-trend positive">
            <ArrowUpRight size={12} />
            High Accuracy
          </span>
        </div>
        <div className="kpi-value">
          {passRate}%
        </div>
        <div className="kpi-subtext">
          {totalSubmissions} total submission attempts
        </div>
      </div>

      {/* KPI 3 */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Max Difficulty Solved</span>
          <span className="kpi-trend">
            ★ Peak AC
          </span>
        </div>
        <div className="kpi-value" style={{ color: 'var(--accent-orange)' }}>
          {maxRating}
        </div>
        <div className="kpi-subtext">
          Highest problem rating solved
        </div>
      </div>

      {/* KPI 4 */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Average Solve Difficulty</span>
          <span className="kpi-trend">
            Mean Score
          </span>
        </div>
        <div className="kpi-value" style={{ color: 'var(--accent-purple)' }}>
          {avgRating}
        </div>
        <div className="kpi-subtext">
          Average difficulty across solved set
        </div>
      </div>
    </div>
  );
}
