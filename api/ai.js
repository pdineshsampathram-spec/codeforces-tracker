import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL = 'meta/llama-3.1-8b-instruct';

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
  const uniqueSolved = new Set(okSubmissions.map(s => `${s.contestId || s.contest_id}-${s.index || s.problem_index}`)).size;

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

  return {
    handle,
    totalSubmissions,
    uniqueSolved,
    passRate,
    maxRating,
    avgRating,
    topTopicNames,
    topTopicsDetailed,
  };
}

export async function generateAiDiagnostics(handle, submissions = []) {
  const stats = assembleUserPrompt(handle, submissions);
  const nextTargetRating = Math.min(3000, stats.maxRating + 100);

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

  const systemMessage = `You are CodeforcesPro AI Assistant, an expert competitive programming coach. Answer directly in under 3 concise sentences for handle ${handle} (Max Rating Solved: ${stats.maxRating}, Total Solved: ${stats.uniqueSolved}, Top Topics: ${stats.topTopicNames}).`;

  try {
    return await callNvidiaApi([
      { role: 'system', content: systemMessage },
      { role: 'user', content: userQuestion },
    ], 6000);
  } catch (err) {
    return `Based on telemetry for **${handle}** (Max rating solved: ${stats.maxRating}, Total solved: ${stats.uniqueSolved}, Top topics: ${stats.topTopicNames}): For your next practice session, target problems rated **${stats.maxRating + 100}** in ${stats.topTopicNames}.`;
  }
}
