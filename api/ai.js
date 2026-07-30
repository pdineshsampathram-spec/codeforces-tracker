import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL = 'meta/llama-3.3-70b-instruct'; // Powerful 70B model on Nvidia API

async function callNvidiaApi(messages) {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY is not configured');
  }

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages,
      temperature: 0.5,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Nvidia API Error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || 'No response generated.';
}

// Build structured telemetry prompt from user's real solve history
function assembleUserPrompt(handle, submissions) {
  const okSubmissions = submissions.filter(s => s.verdict === 'OK' || s.verdict === 'Accepted');
  const totalSolved = new Set(okSubmissions.map(s => `${s.contestId || s.contest_id}-${s.index || s.problem_index}`)).size;

  const tagCounts = {};
  const ratingCounts = {};
  const okRatings = [];

  okSubmissions.forEach(s => {
    const rating = s.rating || s.problem?.rating || s.problem_rating;
    const tags = s.tags || s.problem?.tags || s.problem_tags || [];

    if (rating) {
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
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
    topTags: sortedTags.slice(0, 5).map(([t, c]) => `${t} (${c} solved)`).join(', '),
    weakTags: sortedTags.slice(-3).map(([t]) => t).join(', '),
    ratingDistribution: JSON.stringify(ratingCounts),
  };
}

export async function generateAiDiagnostics(handle, submissions) {
  const stats = assembleUserPrompt(handle, submissions);

  const systemMessage = `You are an elite Competitive Programming Coach for Codeforces. Analyze the user's REAL solve data and provide a professional, highly encouraging diagnostic report. Return valid JSON only with keys: "strongestTopics", "nextTargetRating", "passRateSummary", "diagnosticSummary", "recommendedPlan".`;

  const userMessage = `User Codeforces Handle: ${stats.handle}
Stats:
- Total Submissions: ${stats.totalSubmissions}
- Unique Solved Problems: ${stats.totalSolved}
- Accuracy / Pass Rate: ${stats.passRate}%
- Max Solved Rating: ${stats.maxRating}
- Average Solved Rating: ${stats.avgRating}
- Top Strongest Topics: ${stats.topTags || 'Greedy, Math'}
- Rating Distribution: ${stats.ratingDistribution}

Generate JSON diagnostics in this exact format:
{
  "strongestTopics": "Name 2 top tags",
  "nextTargetRating": number,
  "passRateSummary": "1 sentence on accuracy",
  "diagnosticSummary": [
    { "title": "Headline", "description": "Specific analytical feedback based on their max rating and tags." },
    { "title": "Headline", "description": "Specific practice recommendation." },
    { "title": "Headline", "description": "Topic expansion guidance." }
  ],
  "recommendedPlan": [
    { "day": "Day 1-2", "focus": "Topic", "detail": "Action item" },
    { "day": "Day 3-4", "focus": "Topic", "detail": "Action item" },
    { "day": "Day 5-7", "focus": "Topic", "detail": "Action item" }
  ]
}`;

  try {
    const rawResponse = await callNvidiaApi([
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ]);

    // Extract JSON block
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(rawResponse);
  } catch (err) {
    console.error('Nvidia AI API Error, using fallback engine:', err.message);

    // Fallback if API fails
    const nextRating = Math.min(2400, stats.maxRating + 100);
    return {
      strongestTopics: stats.topTags ? stats.topTags.split(',')[0] : 'Implementation & Math',
      nextTargetRating: nextRating,
      passRateSummary: `${stats.passRate}% AC accuracy across ${stats.totalSubmissions} total submissions`,
      diagnosticSummary: [
        {
          title: `High Efficiency up to ${stats.maxRating} Rating`,
          description: `You have successfully solved problems rated up to ${stats.maxRating}. Your top topic areas are ${stats.topTags || 'Implementation'}.`
        },
        {
          title: `Target Rating Bracket: ${stats.avgRating} - ${nextRating}`,
          description: `To maximize rating growth, focus your daily practice on problems in the ${nextRating} difficulty range.`
        },
        {
          title: 'Topic Expansion & Contest Readiness',
          description: 'Incorporate more Dynamic Programming, Graph Algorithms, and Data Structure problems into your weekly routines.'
        }
      ],
      recommendedPlan: [
        { day: 'Day 1-2', focus: 'Core Strengths', detail: `Solve 3-4 problems in ${stats.topTags || 'Math & Greedy'} at rating ${stats.avgRating}.` },
        { day: 'Day 3-4', focus: 'Target Rating Push', detail: `Attempt 2-3 problems rated ${nextRating} to build contest endurance.` },
        { day: 'Day 5-7', focus: 'Weakness Rectification', detail: 'Practice DP and Data Structure problems with timer enabled.' }
      ],
      provider: 'Nvidia AI (Fallback Engine)'
    };
  }
}

export async function askAiAssistant(handle, submissions, userQuestion) {
  const stats = assembleUserPrompt(handle, submissions);

  const systemMessage = `You are CodeforcesPro AI Assistant, an expert competitive programming mentor. Answer the user's question directly, keeping your response concise, actionable, and tailored to their real stats (Handle: ${handle}, Max Rating Solved: ${stats.maxRating}, Solved: ${stats.totalSolved}).`;

  try {
    return await callNvidiaApi([
      { role: 'system', content: systemMessage },
      { role: 'user', content: userQuestion },
    ]);
  } catch (err) {
    return `Based on your handle **${handle}** (Max rating solved: ${stats.maxRating}, Total unique solved: ${stats.totalSolved}): For your next practice session, target problems rated **${stats.maxRating + 100}** in topics like Greedy, Math, and Dynamic Programming.`;
  }
}
