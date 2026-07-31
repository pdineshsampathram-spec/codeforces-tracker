import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { db } from './db.js';
import { generateAiDiagnostics, askAiAssistant, generateAiRoadmap, fetchLiveProblemset } from './ai.js';
import { setupAuthAndCohortRoutes } from './auth.js';
import { setupAutomationRoutes } from './automation.js';
import { generateSvgBadge } from './badge.js';
import { getAggregatedUserStats } from './leetcode.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Register Auth, Cohorts & Automation endpoints
setupAuthAndCohortRoutes(app);
setupAutomationRoutes(app);

// Server Response Cache (10 min TTL)
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Generate Codeforces API signature
function generateApiSig(methodName, params, apiKey, secret) {
  const rand = Math.random().toString(36).substring(2, 8).padStart(6, 'a');
  const timeSec = Math.floor(Date.now() / 1000).toString();

  const allParams = [
    ...params,
    ['apiKey', apiKey],
    ['time', timeSec]
  ];

  allParams.sort((a, b) => {
    if (a[0] === b[0]) return a[1].localeCompare(b[1]);
    return a[0].localeCompare(b[0]);
  });

  const paramStr = allParams.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const sigBase = `${rand}/${methodName}?${paramStr}#${secret}`;
  
  const hash = crypto.createHash('sha512').update(sigBase).digest('hex');
  const apiSig = rand + hash;

  return { paramStr, apiSig, timeSec };
}

async function fetchFromCodeforces(methodName, params = [], authorized = false) {
  const apiKey = process.env.CF_API_KEY;
  const secret = process.env.CF_API_SECRET;

  let url;
  if (authorized && apiKey && secret) {
    const { paramStr, apiSig } = generateApiSig(methodName, params, apiKey, secret);
    url = `https://codeforces.com/api/${methodName}?${paramStr}&apiSig=${apiSig}`;
  } else {
    const query = params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    url = `https://codeforces.com/api/${methodName}${query ? '?' + query : ''}`;
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Codeforces-Tracker-App/2.0' }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Codeforces API Error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  if (json.status !== 'OK') {
    throw new Error(json.comment || 'Codeforces API returned non-OK status');
  }

  return json.result;
}

// 1. User Full Data Endpoint (with DB fallback & upsert)
app.get('/api/user/:handle', async (req, res) => {
  const { handle } = req.params;
  const cacheKey = `user_full_${handle.toLowerCase()}`;
  const cachedData = getCached(cacheKey);

  if (cachedData) {
    return res.json({ success: true, data: cachedData, cached: true, source: 'cache' });
  }

  // Link handle to DB
  db.linkHandle(handle);

  try {
    const [userInfoList, ratingHistory, submissions] = await Promise.all([
      fetchFromCodeforces('user.info', [['handles', handle]]),
      fetchFromCodeforces('user.rating', [['handle', handle]]).catch(() => []),
      fetchFromCodeforces('user.status', [['handle', handle], ['from', '1'], ['count', '1000']]).catch(() => [])
    ]);

    const userInfo = userInfoList && userInfoList.length > 0 ? userInfoList[0] : null;
    if (!userInfo) {
      return res.status(404).json({ success: false, error: 'User not found on Codeforces' });
    }

    // Upsert into persistent submission_snapshots DB table
    let newUpserted = 0;
    if (submissions && submissions.length > 0) {
      newUpserted = db.upsertSubmissions(handle, submissions);
      db.recordSyncLog(handle, 'SUCCESS', submissions.length);
    }

    const payload = {
      user: userInfo,
      ratingHistory,
      submissions,
      upsertedCount: newUpserted,
    };

    setCache(cacheKey, payload);
    return res.json({ success: true, data: payload, cached: false, source: 'api+db' });
  } catch (error) {
    console.error('API Pull Error, checking DB fallback:', error.message);
    
    // Fallback to DB stored submission snapshots if live API fails
    const storedSubs = db.getStoredSubmissions(handle);
    if (storedSubs && storedSubs.length > 0) {
      db.recordSyncLog(handle, 'FAILED', storedSubs.length, error.message);

      const fallbackPayload = {
        user: {
          handle: handle,
          rank: 'Active CP Solver',
          rating: 1200,
          maxRating: 1200,
          avatar: 'https://userpic.codeforces.org/no-avatar.jpg',
        },
        ratingHistory: [],
        submissions: storedSubs.map(s => ({
          id: s.submission_id,
          verdict: s.verdict,
          programmingLanguage: s.programming_language,
          creationTimeSeconds: s.creation_time_seconds,
          problem: {
            contestId: s.contest_id,
            index: s.problem_index,
            name: s.problem_name,
            rating: s.problem_rating,
            tags: s.problem_tags,
          }
        })),
        isFallback: true,
      };

      return res.json({ success: true, data: fallbackPayload, cached: false, source: 'db_fallback' });
    }

    db.recordSyncLog(handle, 'FAILED', 0, error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Historical Trend Endpoint (Powered by stored DB snapshots)
app.get('/api/history/:handle', async (req, res) => {
  const { handle } = req.params;
  const days = parseInt(req.query.days) || 30;
  const trendData = db.getHistoricalTrends(handle, days);
  return res.json({ success: true, data: trendData });
});

// 3. Sync Log Endpoint
app.get('/api/synclog/:handle', async (req, res) => {
  const { handle } = req.params;
  const logs = db.getSyncLog(handle);
  return res.json({ success: true, data: logs });
});

// 3b. Real AI Diagnostics Endpoint (Powered by Nvidia Llama)
app.post('/api/ai/insights', async (req, res) => {
  try {
    const { handle, submissions = [] } = req.body;
    if (!handle) return res.status(400).json({ success: false, error: 'Handle required' });
    const result = await generateAiDiagnostics(handle, submissions);
    return res.json({ success: true, data: result });
  } catch (err) {
    if (err.rateLimited) {
      return res.status(429).json({
        success: false,
        rateLimited: true,
        error: err.message,
        resetTime: err.resetTime,
        remainingSeconds: err.remainingSeconds,
      });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3c. Natural Language Practice Assistant Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { handle, submissions = [], question } = req.body;
    if (!question) return res.status(400).json({ success: false, error: 'Question required' });
    const answer = await askAiAssistant(handle, submissions, question);
    return res.json({ success: true, answer });
  } catch (err) {
    if (err.rateLimited) {
      return res.status(429).json({
        success: false,
        rateLimited: true,
        error: err.message,
        resetTime: err.resetTime,
        remainingSeconds: err.remainingSeconds,
      });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3d. AI Roadmap Generation Endpoint
app.post('/api/ai/roadmap', async (req, res) => {
  try {
    const { handle, submissions = [], ratingHistory = [], user = null, targetRating = 1400 } = req.body;
    if (!handle) return res.status(400).json({ success: false, error: 'Handle required' });
    const result = await generateAiRoadmap(handle, submissions, ratingHistory, user, targetRating);
    return res.json({ success: true, data: result });
  } catch (err) {
    if (err.rateLimited) {
      return res.status(429).json({
        success: false,
        rateLimited: true,
        error: err.message,
        resetTime: err.resetTime,
        remainingSeconds: err.remainingSeconds,
      });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3e. Embeddable SVG Badge Endpoint (For GitHub READMEs)
app.get('/api/badge/:handle.svg', async (req, res) => {
  let { handle } = req.params;
  handle = handle.replace(/\.svg$/, '');
  
  try {
    const userInfoList = await fetchFromCodeforces('user.info', [['handles', handle]]).catch(() => []);
    const userInfo = userInfoList?.[0] || null;
    const svg = generateSvgBadge(handle, userInfo);
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.send(svg);
  } catch (err) {
    const svg = generateSvgBadge(handle);
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(svg);
  }
});

app.get('/api/badge/:handle', async (req, res) => {
  const { handle } = req.params;
  const cleanHandle = handle.replace(/\.svg$/, '');
  const svg = generateSvgBadge(cleanHandle);
  res.setHeader('Content-Type', 'image/svg+xml');
  return res.send(svg);
});

// 3e. Multi-Platform Aggregated Telemetry Endpoint
app.get('/api/user-aggregated/:handle', async (req, res) => {
  const { handle } = req.params;
  const aggregated = await getAggregatedUserStats(handle);
  return res.json({ success: true, data: aggregated });
});

// 3f. Live Codeforces Problemset Endpoint
app.get('/api/problemset', async (req, res) => {
  try {
    const problems = await fetchLiveProblemset();
    if (!problems || problems.length === 0) {
      return res.status(503).json({ success: false, error: 'Unable to retrieve official Codeforces problems. Please synchronize the problemset API before generating the roadmap.' });
    }
    return res.json({ success: true, data: problems });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Unable to retrieve official Codeforces problems. Please synchronize the problemset API before generating the roadmap.' });
  }
});

// 4. Upcoming Contests Endpoint
app.get('/api/contests', async (req, res) => {
  const cacheKey = 'contests_upcoming';
  const cachedData = getCached(cacheKey);

  if (cachedData) {
    return res.json({ success: true, data: cachedData, cached: true });
  }

  try {
    const contests = await fetchFromCodeforces('contest.list', [['gym', 'false']]);
    setCache(cacheKey, contests);
    return res.json({ success: true, data: contests, cached: false });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Status Check Endpoint
app.get('/api/status-check', async (req, res) => {
  try {
    if (process.env.CF_API_KEY && process.env.CF_API_SECRET) {
      await fetchFromCodeforces('user.friends', [['onlyCodeforces', 'false']], true);
      return res.json({ success: true, authenticated: true });
    }
    return res.json({ success: true, authenticated: false });
  } catch (error) {
    return res.json({ success: false, authenticated: false, error: error.message });
  }
});

// 6. Automated Cron Sync Endpoint (Vercel Cron / Daily background sync)
app.get('/api/cron/sync', async (req, res) => {
  const handles = db.getLinkedHandles();
  const results = [];

  for (const lh of handles) {
    try {
      const submissions = await fetchFromCodeforces('user.status', [['handle', lh.handle], ['from', '1'], ['count', '500']]);
      if (submissions && submissions.length > 0) {
        const count = db.upsertSubmissions(lh.handle, submissions);
        db.recordSyncLog(lh.handle, 'SUCCESS', submissions.length);
        results.push({ handle: lh.handle, status: 'synced', newSubmissions: count });
      }
    } catch (err) {
      db.recordSyncLog(lh.handle, 'FAILED', 0, err.message);
      results.push({ handle: lh.handle, status: 'failed', error: err.message });
    }
  }

  return res.json({ success: true, timestamp: new Date().toISOString(), syncedHandles: results });
});

export default app;
