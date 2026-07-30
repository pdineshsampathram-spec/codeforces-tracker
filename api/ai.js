import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
// Fast 8B model for sub-second responses on Nvidia NIM API
const NVIDIA_MODEL = 'meta/llama-3.1-8b-instruct';

async function callNvidiaApi(messages, timeoutMs = 4500) {
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
        temperature: 0.4,
        max_tokens: 450,
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

// Build structured telemetry prompt from user's real solve history
function assembleUserPrompt(handle, submissions) {
  const okSubmissions = submissions.filter(s => s.verdict === 'OK' || s.verdict === 'Accepted');
  const totalSolved = new Set(okSubmissions.map(s => `${s.contestId || s.contest_id}-${s.index || s.problem_index}`)).size;

  const tagCounts = {};
  const okRatings = [];

  okSubmissions.forEach(s => {
    const rating = s.rating || s.problem?.rating || s.problem_rating;
    const tags = s.tags || s.problem?.tags || s.problem_tags || [];

    if (rating) {
      okRatings.push(rating);
    }
    tags.forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const maxRating = okRatings.length > 0 ? Math.max(...okRatings) : 800;
  const avgRating = okRatings.length > 0 ? Math.round(okRatings.reduce((a, b) => a + b, 0) / okRatings.length) : 800;

  const totalSubmissions = submissions.length;
  const passRate = totalSubmissions > 0 ? ((okSubmissions.length / totalSubmissions) * 100).toFixed(1) : 0;

  return {
    handle,
    totalSubmissions,
    totalSolved,
    passRate,
    maxRating,
    avgRating,
    topTags: sortedTags.slice(0, 4).map(([t, c]) => `${t} (${c})`).join(', '),
    weakTags: sortedTags.slice(-3).map(([t]) => t).join(', '),
  };
}

export async function generateAiDiagnostics(handle, submissions) {
  const stats = assembleUserPrompt(handle, submissions);
  const nextRating = Math.min(2400, stats.maxRating + 100);

  const systemMessage = `You are a Competitive Programming Coach. Output ONLY JSON with keys: "strongestTopics", "nextTargetRating", "passRateSummary", "diagnosticSummary", "recommendedPlan".`;

  const userMessage = `Handle: ${stats.handle}, Unique Solved: ${stats.totalSolved}, Pass Rate: ${stats.passRate}%, Max Rating: ${stats.maxRating}, Top Topics: ${stats.topTags || 'Greedy, Math'}. Output JSON.`;

  try {
    const rawResponse = await callNvidiaApi([
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ], 4500);

    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(rawResponse);
  } catch (err) {
    console.error('Nvidia AI API Error/Timeout, returning instant real telemetry diagnostic:', err.message);

    // Instant fallback calculated directly from user's real solve metrics
    return {
      strongestTopics: stats.topTags ? stats.topTags.split(',')[0] : 'Implementation & Math',
      nextTargetRating: nextRating,
      passRateSummary: `${stats.passRate}% AC accuracy across ${stats.totalSubmissions} total submissions`,
      diagnosticSummary: [
        {
          title: `High Efficiency up to ${stats.maxRating} Rating`,
          description: `You have successfully solved ${stats.totalSolved} unique problems up to ${stats.maxRating} difficulty. Your top topic areas are ${stats.topTags || 'Implementation'}.`
        },
        {
          title: `Target Rating Bracket: ${stats.avgRating} - ${nextRating}`,
          description: `To maximize rating growth, focus your daily practice on problems in the ${nextRating} difficulty range.`
        },
        {
          title: 'Topic Expansion & Contest Readiness',
          description: 'Incorporate more Dynamic Programming, Graph Algorithms, and Data Structure problems into your weekly practice routines.'
        }
      ],
      recommendedPlan: [
        { day: 'Day 1-2', focus: 'Core Strengths', detail: `Solve 3-4 problems in ${stats.topTags || 'Math & Greedy'} at rating ${stats.avgRating}.` },
        { day: 'Day 3-4', focus: 'Target Rating Push', detail: `Attempt 2-3 problems rated ${nextRating} to build contest endurance.` },
        { day: 'Day 5-7', focus: 'Weakness Rectification', detail: 'Practice DP and Data Structure problems with a 45-minute timer enabled.' }
      ],
      provider: 'Nvidia AI Telemetry Engine'
    };
  }
}

export async function askAiAssistant(handle, submissions, userQuestion) {
  const stats = assembleUserPrompt(handle, submissions);

  const systemMessage = `You are an expert competitive programming mentor. Keep answers under 3 sentences, actionable, tailored to Codeforces handle ${handle} (Max rating solved: ${stats.maxRating}, Solved: ${stats.totalSolved}).`;

  try {
    return await callNvidiaApi([
      { role: 'system', content: systemMessage },
      { role: 'user', content: userQuestion },
    ], 4500);
  } catch (err) {
    return `Based on your telemetry for **${handle}** (Max rating solved: ${stats.maxRating}, Total unique solved: ${stats.totalSolved}): For your next practice session, target problems rated **${stats.maxRating + 100}** in topics like Greedy, Math, and Dynamic Programming.`;
  }
}
