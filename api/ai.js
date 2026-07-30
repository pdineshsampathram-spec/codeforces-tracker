import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL = 'meta/llama-3.1-8b-instruct';

// Curated Bank of REAL Codeforces Problems with exact Contest IDs, Names, Ratings & Tags
const REAL_CF_PROBLEMS = [
  // 800 Rating
  { id: '1944A', name: 'Destroying Bridges', rating: 800, tags: ['greedy', 'math'], contest: 'Codeforces Round 934 (Div. 2)', url: 'https://codeforces.com/problemset/problem/1944/A' },
  { id: '1950A', name: 'Stair, Peak, or Neither?', rating: 800, tags: ['implementation'], contest: 'Codeforces Round 937 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1950/A' },
  { id: '1950C', name: 'Clock Conversion', rating: 800, tags: ['implementation', 'strings'], contest: 'Codeforces Round 937 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1950/C' },
  { id: '1915C', name: 'Can I Square?', rating: 800, tags: ['binary search', 'math'], contest: 'Codeforces Round 918 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1915/C' },
  { id: '1850A', name: 'To My Critics', rating: 800, tags: ['implementation'], contest: 'Codeforces Round 886 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1850/A' },
  { id: '1850C', name: 'Word on the Paper', rating: 800, tags: ['implementation'], contest: 'Codeforces Round 886 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1850/C' },
  { id: '1927A', name: 'Make it White', rating: 800, tags: ['greedy', 'strings'], contest: 'Codeforces Round 925 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1927/A' },
  { id: '1985A', name: 'Creating Words', rating: 800, tags: ['implementation', 'strings'], contest: 'Codeforces Round 952 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1985/A' },

  // 900-1000 Rating
  { id: '1941A', name: 'Rudolf and the Ticket', rating: 800, tags: ['brute force'], contest: 'Codeforces Round 933 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1941/A' },
  { id: '1950B', name: 'Progressive Matrix', rating: 900, tags: ['constructive algorithms'], contest: 'Codeforces Round 937 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1950/B' },
  { id: '1921C', name: 'Sending Messages', rating: 900, tags: ['greedy'], contest: 'Codeforces Round 920 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1921/C' },
  { id: '1915D', name: 'Unnatural Language Processing', rating: 900, tags: ['greedy', 'strings'], contest: 'Codeforces Round 918 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1915/D' },

  // 1000-1200 Rating
  { id: '1941C', name: 'Rudolf and the Ugly String', rating: 1000, tags: ['dp', 'greedy', 'strings'], contest: 'Codeforces Round 933 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1941/C' },
  { id: '1927C', name: 'Choose the Different Ones!', rating: 1000, tags: ['two pointers'], contest: 'Codeforces Round 925 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1927/C' },
  { id: '1915E', name: 'Romantic Glasses', rating: 1200, tags: ['data structures', 'math'], contest: 'Codeforces Round 918 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1915/E' },
  { id: '1950D', name: 'Product of Binary Decimals', rating: 1100, tags: ['brute force', 'dp', 'math'], contest: 'Codeforces Round 937 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1950/D' },

  // 1200-1400 Rating
  { id: '1941D', name: 'Rudolf and the Ball Game', rating: 1200, tags: ['dfs and similar', 'dp'], contest: 'Codeforces Round 933 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1941/D' },
  { id: '1927D', name: 'Find the Different Ones!', rating: 1300, tags: ['binary search', 'data structures'], contest: 'Codeforces Round 925 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1927/D' },
  { id: '1915F', name: 'Greetings', rating: 1400, tags: ['data structures', 'sortings'], contest: 'Codeforces Round 918 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1915/F' },

  // 1400-1600 Rating
  { id: '1941E', name: 'Rudolf and k Bridges', rating: 1500, tags: ['data structures', 'dp'], contest: 'Codeforces Round 933 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1941/E' },
  { id: '1927E', name: 'Klever Permutation', rating: 1400, tags: ['constructive algorithms'], contest: 'Codeforces Round 925 (Div. 3)', url: 'https://codeforces.com/problemset/problem/1927/E' },
  { id: '1915G', name: 'Bicycles', rating: 1600, tags: ['shortest paths', 'graphs'], contest: 'Codeforces Round 918 (Div. 4)', url: 'https://codeforces.com/problemset/problem/1915/G' },
];

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
function assembleUserPrompt(handle, inputSubmissions = []) {
  let subs = Array.isArray(inputSubmissions) && inputSubmissions.length > 0 ? inputSubmissions : [];
  if (subs.length === 0) {
    subs = db.getStoredSubmissions(handle);
  }

  const okSubmissions = subs.filter(s => s.verdict === 'OK' || s.verdict === 'Accepted');
  const solvedKeys = new Set(okSubmissions.map(s => `${s.contestId || s.contest_id}-${s.index || s.problem_index}`));
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

  // Filter REAL candidate problems matching user target rating that user has NOT solved yet
  const targetRating = Math.min(2400, maxRating + 100);
  const recommendedProblems = REAL_CF_PROBLEMS.filter(p => !solvedKeys.has(p.id))
    .sort((a, b) => Math.abs(a.rating - targetRating) - Math.abs(b.rating - targetRating))
    .slice(0, 5);

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
  };
}

export async function generateAiDiagnostics(handle, submissions = []) {
  const stats = assembleUserPrompt(handle, submissions);
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
    console.error('Nvidia AI API Error, generating telemetry diagnostic report:', err.message);
  }

  // Pure data-backed telemetry report calculated directly from the user's real stats
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
  const stats = assembleUserPrompt(handle, submissions);

  const realProblemListText = stats.recommendedProblems
    .map(p => `- ${p.id}: "${p.name}" (Rating: ${p.rating}, Tags: ${p.tags.join(', ')}, Contest: ${p.contest})`)
    .join('\n');

  const systemMessage = `You are CodeforcesPro AI Assistant, an expert Codeforces competitive programming coach.
Handle: ${handle}
User Telemetry: Max Rating Solved = ${stats.maxRating}, Total Solved = ${stats.uniqueSolved}, Top Solved Topics = ${stats.topTopicNames}.

CRITICAL INSTRUCTION FOR PROBLEM RECOMMENDATIONS:
NEVER invent or hallucinate fake problem names (e.g. NEVER suggest "C. 123"). ALWAYS recommend ONLY from this real list of Codeforces problems matching their rating level:
${realProblemListText}

When recommending a problem, include its EXACT ID, exact Name, Rating, Contest, and tell the user why it fits their skill level. Keep your answer under 4 concise, helpful sentences.`;

  try {
    return await callNvidiaApi([
      { role: 'system', content: systemMessage },
      { role: 'user', content: userQuestion },
    ], 6000);
  } catch (err) {
    const p1 = stats.recommendedProblems[0] || REAL_CF_PROBLEMS[0];
    return `Based on telemetry for **${handle}** (Max rating solved: ${stats.maxRating}, Total solved: ${stats.uniqueSolved}):\n\nI recommend solving **${p1.id} - "${p1.name}"** (Rating: ${p1.rating}, ${p1.contest}). It matches your target difficulty of ${stats.targetRating}!`;
  }
}
