import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL = 'meta/llama-3.1-8b-instruct';

export class RateLimitError extends Error {
  constructor(message, resetTimeIso, remainingSeconds) {
    super(message);
    this.name = 'RateLimitError';
    this.rateLimited = true;
    this.resetTime = resetTimeIso;
    this.remainingSeconds = remainingSeconds;
  }
}

// Calculate real UTC midnight API reset time
function getRealResetTime() {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  const remainingMs = tomorrow.getTime() - now.getTime();
  return {
    resetTimeIso: tomorrow.toISOString(),
    remainingSeconds: Math.max(0, Math.floor(remainingMs / 1000)),
  };
}

// Fallback bank of official Codeforces Problems
const FALLBACK_CF_PROBLEMS = [
  { id: '1944A', name: 'Destroying Bridges', rating: 800, tags: ['greedy', 'math'], contest: 'Codeforces Round 934 (Div. 2)', url: 'https://codeforces.com/problemset/problem/1944/A' },
  { id: '1950A', name: 'Stair, Peak, or Neither?', rating: 800, tags: ['implementation'], contest: 'Codeforces Round 937 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1950/A' },
  { id: '1950C', name: 'Clock Conversion', rating: 800, tags: ['implementation', 'strings'], contest: 'Codeforces Round 937 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1950/C' },
  { id: '1915C', name: 'Can I Square?', rating: 800, tags: ['binary search', 'math'], contest: 'Codeforces Round 918 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1915/C' },
  { id: '1850A', name: 'To My Critics', rating: 800, tags: ['implementation'], contest: 'Codeforces Round 886 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1850/A' },
  { id: '1850C', name: 'Word on the Paper', rating: 800, tags: ['implementation'], contest: 'Codeforces Round 886 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1850/C' },
  { id: '1927A', name: 'Make it White', rating: 800, tags: ['greedy', 'strings'], contest: 'Codeforces Round 925 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1927/A' },
  { id: '1985A', name: 'Creating Words', rating: 800, tags: ['implementation', 'strings'], contest: 'Codeforces Round 952 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1985/A' },
  { id: '1941A', name: 'Rudolf and the Ticket', rating: 800, tags: ['brute force'], contest: 'Codeforces Round 933 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1941/A' },
  { id: '1950B', name: 'Progressive Matrix', rating: 900, tags: ['constructive algorithms'], contest: 'Codeforces Round 937 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1950/B' },
  { id: '1921C', name: 'Sending Messages', rating: 900, tags: ['greedy'], contest: 'Codeforces Round 920 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1921/C' },
  { id: '1915D', name: 'Unnatural Language Processing', rating: 900, tags: ['greedy', 'strings'], contest: 'Codeforces Round 918 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1915/D' },
  { id: '1941C', name: 'Rudolf and the Ugly String', rating: 1000, tags: ['dp', 'greedy', 'strings'], contest: 'Codeforces Round 933 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1941/C' },
  { id: '1927C', name: 'Choose the Different Ones!', rating: 1000, tags: ['two pointers'], contest: 'Codeforces Round 925 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1927/C' },
  { id: '1915E', name: 'Romantic Glasses', rating: 1200, tags: ['data structures', 'math'], contest: 'Codeforces Round 918 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1915/E' },
  { id: '1950D', name: 'Product of Binary Decimals', rating: 1100, tags: ['brute force', 'dp', 'math'], contest: 'Codeforces Round 937 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1950/D' },
  { id: '1941D', name: 'Rudolf and the Ball Game', rating: 1200, tags: ['dfs and similar', 'dp'], contest: 'Codeforces Round 933 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1941/D' },
  { id: '1927D', name: 'Find the Different Ones!', rating: 1300, tags: ['binary search', 'data structures'], contest: 'Codeforces Round 925 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1927/D' },
  { id: '1915F', name: 'Greetings', rating: 1400, tags: ['data structures', 'sortings'], contest: 'Codeforces Round 918 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1915/F' },
  { id: '1941E', name: 'Rudolf and k Bridges', rating: 1500, tags: ['data structures', 'dp'], contest: 'Codeforces Round 933 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1941/E' },
  { id: '1927E', name: 'Klever Permutation', rating: 1400, tags: ['constructive algorithms'], contest: 'Codeforces Round 925 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1927/E' },
  { id: '1915G', name: 'Bicycles', rating: 1600, tags: ['shortest paths', 'graphs'], contest: 'Codeforces Round 918 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1915/G' },
];

// Live Problemset Cache (1 hour TTL)
let cachedLiveProblemset = null;
let lastProblemsetFetch = 0;

async function fetchLiveProblemset() {
  const now = Date.now();
  if (cachedLiveProblemset && now - lastProblemsetFetch < 3600 * 1000) {
    return cachedLiveProblemset;
  }

  try {
    const res = await fetch('https://codeforces.com/api/problemset.problems');
    const json = await res.json();

    if (json.status === 'OK' && json.result?.problems) {
      const liveProblems = json.result.problems
        .filter(p => p.rating && p.name && p.contestId && p.index)
        .map(p => ({
          id: `${p.contestId}${p.index}`,
          contestId: p.contestId,
          index: p.index,
          name: p.name,
          rating: p.rating,
          tags: p.tags || [],
          contest: `Codeforces Contest ${p.contestId}`,
          url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
        }));

      if (liveProblems.length > 100) {
        cachedLiveProblemset = liveProblems;
        lastProblemsetFetch = now;
        return liveProblems;
      }
    }
  } catch (err) {
    console.error('Failed to fetch live Codeforces problemset, using fallback set:', err.message);
  }

  return FALLBACK_CF_PROBLEMS;
}

async function callNvidiaApi(messages, timeoutMs = 6000) {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY is not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      const { resetTimeIso, remainingSeconds } = getRealResetTime();
      throw new RateLimitError(
        "Today's API rate limit reached on this server. Please wait until the reset time.",
        resetTimeIso,
        remainingSeconds
      );
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Nvidia API Error (${response.status}): ${errText}`);
    }

    const json = await response.json();
    return json.choices?.[0]?.message?.content || 'No response generated.';
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Build accurate telemetry metrics from real user submissions
async function assembleUserPrompt(handle, inputSubmissions = []) {
  let subs = Array.isArray(inputSubmissions) && inputSubmissions.length > 0 ? inputSubmissions : [];
  if (subs.length === 0) {
    subs = db.getStoredSubmissions(handle);
  }

  const okSubmissions = subs.filter(s => s.verdict === 'OK' || s.verdict === 'Accepted');
  const solvedKeys = new Set(okSubmissions.map(s => `${s.contestId || s.contest_id}${s.index || s.problem_index}`));
  const uniqueSolved = solvedKeys.size;

  const tagCounts = {};
  const okRatings = [];

  okSubmissions.forEach(s => {
    const rating = s.rating || s.problem?.rating || s.problem_rating;
    const tags = s.tags || s.problem?.tags || s.problem_tags || [];

    if (rating && typeof rating === 'number') {
      okRatings.push(rating);
    }
    tags.forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const maxRating = okRatings.length > 0 ? Math.max(...okRatings) : 1000;
  const avgRating = okRatings.length > 0 ? Math.round(okRatings.reduce((a, b) => a + b, 0) / okRatings.length) : 800;

  const totalSubmissions = subs.length;
  const passRate = totalSubmissions > 0 ? ((okSubmissions.length / totalSubmissions) * 100).toFixed(1) : '0.0';

  const topTopicNames = sortedTags.slice(0, 4).map(([t]) => t.toUpperCase()).join(', ') || 'IMPLEMENTATION, MATH';
  const topTopicsDetailed = sortedTags.slice(0, 4).map(([t, c]) => `${t} (${c} solved)`).join(', ') || 'Implementation, Math';

  // Fetch full live Codeforces problemset
  const fullProblemset = await fetchLiveProblemset();

  const targetRating = Math.min(3500, maxRating + 100);
  const recommendedProblems = fullProblemset
    .filter(p => !solvedKeys.has(p.id) && Math.abs(p.rating - targetRating) <= 200)
    .sort((a, b) => Math.abs(a.rating - targetRating) - Math.abs(b.rating - targetRating))
    .slice(0, 8);

  return {
    handle,
    totalSubmissions,
    uniqueSolved,
    passRate,
    maxRating,
    avgRating,
    targetRating,
    topTopicNames,
    topTopicsDetailed,
    recommendedProblems,
    fullProblemset,
  };
}

export async function generateAiDiagnostics(handle, submissions = []) {
  const stats = await assembleUserPrompt(handle, submissions);
  const nextTargetRating = stats.targetRating;

  const systemMessage = `You are an elite Competitive Programming Coach for Codeforces.
Analyze the user's real solve metrics and return ONLY a single JSON object.
JSON keys must be:
- "strongestTopics": (string) e.g. "${stats.topTopicNames}"
- "nextTargetRating": (number) e.g. ${nextTargetRating}
- "passRateSummary": (string) e.g. "${stats.passRate}% pass rate across ${stats.totalSubmissions} submissions"
- "diagnosticSummary": array of 3 objects, each with "title" (string) and "description" (string)
- "recommendedPlan": array of 3 objects, each with "day" (string), "focus" (string), and "detail" (string)`;

  const userMessage = `Handle: ${stats.handle}
- Total Submissions: ${stats.totalSubmissions}
- Unique Solved: ${stats.uniqueSolved}
- Accuracy: ${stats.passRate}%
- Max Rating Solved: ${stats.maxRating}
- Avg Rating Solved: ${stats.avgRating}
- Top Solved Topics: ${stats.topTopicsDetailed}

Generate tailored JSON diagnostics for this handle.`;

  try {
    const rawResponse = await callNvidiaApi([
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ], 6000);

    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        strongestTopics: typeof parsed.strongestTopics === 'string' ? parsed.strongestTopics : stats.topTopicNames,
        nextTargetRating: typeof parsed.nextTargetRating === 'number' ? parsed.nextTargetRating : nextTargetRating,
        passRateSummary: typeof parsed.passRateSummary === 'string' ? parsed.passRateSummary : `${stats.passRate}% pass rate across ${stats.totalSubmissions} total submissions`,
        diagnosticSummary: Array.isArray(parsed.diagnosticSummary) ? parsed.diagnosticSummary : [],
        recommendedPlan: Array.isArray(parsed.recommendedPlan) ? parsed.recommendedPlan : [],
      };
    }
  } catch (err) {
    if (err.rateLimited) throw err;
    console.error('Nvidia AI API Error, generating telemetry diagnostic report:', err.message);
  }

  return {
    strongestTopics: stats.topTopicNames,
    nextTargetRating: nextTargetRating,
    passRateSummary: `${stats.passRate}% pass rate across ${stats.totalSubmissions} total submissions`,
    diagnosticSummary: [
      {
        title: `High Solve Volume in ${stats.topTopicNames}`,
        description: `${stats.handle} has successfully solved ${stats.uniqueSolved} unique problems with a max rating of ${stats.maxRating}. Most solved topics are ${stats.topTopicsDetailed}.`
      },
      {
        title: `Optimal Rating Push Target: ${nextTargetRating}`,
        description: `Your average solved rating is ${stats.avgRating}. To push your Codeforces rating to the next rank tier, focus daily practice on problems rated ${nextTargetRating}.`
      },
      {
        title: 'Accuracy & Speed Tuning',
        description: `Current submission accuracy is ${stats.passRate}% across ${stats.totalSubmissions} attempts. Practice solving target problems under a 45-minute contest timer.`
      }
    ],
    recommendedPlan: [
      { day: 'Day 1-2', focus: 'Strengthen Top Topics', detail: `Solve 3-4 problems in ${stats.topTopicNames} rated ${stats.avgRating}.` },
      { day: 'Day 3-4', focus: `Push Target ${nextTargetRating}`, detail: `Attempt 2-3 problems rated ${nextTargetRating} to build rating confidence.` },
      { day: 'Day 5-7', focus: 'Weak Topic Expansion', detail: 'Practice Dynamic Programming and Data Structures under timed contest conditions.' }
    ]
  };
}

export async function askAiAssistant(handle, submissions = [], userQuestion = '') {
  const stats = await assembleUserPrompt(handle, submissions);

  const realProblemListText = stats.recommendedProblems
    .map(p => `- ${p.id}: "${p.name}" (Rating: ${p.rating}, Tags: ${p.tags.join(', ')}, Contest: ${p.contest}, URL: ${p.url})`)
    .join('\n');

  const systemMessage = `You are CodeforcesPro AI Assistant, an expert Codeforces competitive programming coach with full access to the official Codeforces problem database.
Handle: ${handle}
User Telemetry: Max Rating Solved = ${stats.maxRating}, Total Solved = ${stats.uniqueSolved}, Top Solved Topics = ${stats.topTopicNames}.

CRITICAL INSTRUCTIONS:
1. You have live access to thousands of official Codeforces problems from the API.
2. Here are real candidate problems from Codeforces matching the user's rating level (${stats.targetRating}):
${realProblemListText}

When answering or recommending problems, ALWAYS recommend official problems with exact Problem ID (e.g. 1944A), exact Problem Name (e.g. "Destroying Bridges"), Rating, and direct URL. Keep your answer under 4 concise, helpful sentences.`;

  try {
    return await callNvidiaApi([
      { role: 'system', content: systemMessage },
      { role: 'user', content: userQuestion },
    ], 6000);
  } catch (err) {
    if (err.rateLimited) throw err;
    const p1 = stats.recommendedProblems[0] || FALLBACK_CF_PROBLEMS[0];
    return `Based on telemetry for **${handle}** (Max rating solved: ${stats.maxRating}, Total solved: ${stats.uniqueSolved}):\n\nI recommend solving **[${p1.id} - ${p1.name}](${p1.url})** (Rating: ${p1.rating}, ${p1.contest}). It matches your target difficulty of ${stats.targetRating}!`;
  }
}
