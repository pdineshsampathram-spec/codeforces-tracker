import { db } from './db.js';

export async function fetchLeetCodeStats(username) {
  try {
    const query = `
      query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `;

    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { username } }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const stats = json.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum;

    if (!stats) return null;

    const easy = stats.find(s => s.difficulty === 'Easy')?.count || 0;
    const medium = stats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hard = stats.find(s => s.difficulty === 'Hard')?.count || 0;
    const total = stats.find(s => s.difficulty === 'All')?.count || (easy + medium + hard);

    return {
      platform: 'LeetCode',
      username,
      totalSolved: total,
      easySolved: easy,
      mediumSolved: medium,
      hardSolved: hard,
    };
  } catch (err) {
    return null;
  }
}

export async function getAggregatedUserStats(handle) {
  const cfSubs = db.getStoredSubmissions(handle);
  const okCfSubs = cfSubs.filter(s => s.verdict === 'OK' || s.verdict === 'Accepted');
  const cfUniqueSolved = new Set(okCfSubs.map(s => `${s.contest_id}-${s.problem_index}`)).size;

  // Try to fetch LeetCode stats for same handle as stretch source
  const lcStats = await fetchLeetCodeStats(handle).catch(() => null);

  return {
    handle,
    codeforces: {
      totalSubmissions: cfSubs.length,
      uniqueSolved: cfUniqueSolved,
    },
    leetcode: lcStats || {
      platform: 'LeetCode',
      username: handle,
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      note: 'Link LeetCode account to sync stats',
    },
    aggregatedTotalSolved: cfUniqueSolved + (lcStats ? lcStats.totalSolved : 0),
  };
}
