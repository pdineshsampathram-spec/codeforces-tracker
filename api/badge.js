import { db } from './db.js';

function getRankColor(rank) {
  if (!rank) return '#3b82f6';
  const r = rank.toLowerCase();
  if (r.includes('newbie')) return '#aaaaaa';
  if (r.includes('pupil')) return '#77ff77';
  if (r.includes('specialist')) return '#03a89e';
  if (r.includes('expert')) return '#0000ff';
  if (r.includes('candidate master')) return '#a0a';
  if (r.includes('master')) return '#ff8c00';
  if (r.includes('grandmaster')) return '#ff0000';
  return '#3b82f6';
}

export function generateSvgBadge(handle, userData = null, submissions = []) {
  const storedSubs = submissions.length > 0 ? submissions : db.getStoredSubmissions(handle);
  const okSubs = storedSubs.filter(s => s.verdict === 'OK' || s.verdict === 'Accepted');
  
  const uniqueSolved = new Set(okSubs.map(s => `${s.contest_id || s.contestId}-${s.problem_index || s.index}`)).size;
  const ratings = okSubs.map(s => s.problem_rating || s.rating).filter(Boolean);
  const maxRating = ratings.length > 0 ? Math.max(...ratings) : 800;
  
  const totalSubmissions = storedSubs.length;
  const passRate = totalSubmissions > 0 ? ((okSubs.length / totalSubmissions) * 100).toFixed(1) : '0.0';
  
  const rank = userData?.rank || 'CP Solver';
  const currentRating = userData?.rating || maxRating || 1200;
  const rankColor = getRankColor(rank);

  return `<svg width="450" height="195" viewBox="0 0 450 195" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .header { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 16px; font-weight: 700; fill: #f4f4f5; }
    .subtext { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 12px; fill: #a1a1aa; }
    .stat-label { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 11px; font-weight: 600; fill: #71717a; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 700; fill: #f4f4f5; }
    .badge { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 11px; font-weight: 700; fill: ${rankColor}; }
  </style>

  <!-- Background Card -->
  <rect width="450" height="195" rx="12" fill="#111113" stroke="#27272a" stroke-width="1"/>

  <!-- Brand Accent Top Bar -->
  <rect x="0" y="0" width="450" height="4" fill="${rankColor}" rx="2"/>

  <!-- User Avatar / Icon Box -->
  <rect x="20" y="24" width="42" height="42" rx="8" fill="#18181b" stroke="#27272a"/>
  <text x="32" y="50" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="900" fill="#3b82f6">CF</text>

  <!-- Header Info -->
  <text x="74" y="42" className="header">${handle}</text>
  <text x="74" y="58" className="badge">${rank.toUpperCase()}</text>

  <!-- Divider Line -->
  <line x1="20" y1="80" x2="430" y2="80" stroke="#27272a" stroke-width="1"/>

  <!-- Grid of 4 Stat Boxes -->
  <!-- Box 1: Rating -->
  <g transform="translate(20, 95)">
    <text x="0" y="0" className="stat-label">Rating</text>
    <text x="0" y="24" className="stat-value" fill="${rankColor}">${currentRating}</text>
  </g>

  <!-- Box 2: Unique Solved -->
  <g transform="translate(130, 95)">
    <text x="0" y="0" className="stat-label">Solved</text>
    <text x="0" y="24" className="stat-value" fill="#22c55e">${uniqueSolved}</text>
  </g>

  <!-- Box 3: Max Rating -->
  <g transform="translate(240, 95)">
    <text x="0" y="0" className="stat-label">Max Rating</text>
    <text x="0" y="24" className="stat-value" fill="#a855f7">★ ${maxRating}</text>
  </g>

  <!-- Box 4: Accuracy -->
  <g transform="translate(350, 95)">
    <text x="0" y="0" className="stat-label">Accuracy</text>
    <text x="0" y="24" className="stat-value" fill="#3b82f6">${passRate}%</text>
  </g>

  <!-- Footer Branding -->
  <line x1="20" y1="155" x2="430" y2="155" stroke="#27272a" stroke-width="1"/>
  <text x="20" y="176" className="subtext">Verified CodeforcesPro Analytics</text>
  <text x="430" y="176" className="subtext" text-anchor="end">codeforcespro.vercel.app</text>
</svg>`;
}
