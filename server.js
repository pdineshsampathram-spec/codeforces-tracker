import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory cache
const cache = new Map();
const CACHE_TTL = 15000; // 15 seconds

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

  // Sort lexicographically by key, then value
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
    headers: { 'User-Agent': 'Codeforces-Tracker-App/1.0' }
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

// API Routes
app.get('/api/user/:handle', async (req, res) => {
  const { handle } = req.params;
  const cacheKey = `user_full_${handle.toLowerCase()}`;
  const cachedData = getCached(cacheKey);

  if (cachedData) {
    return res.json({ success: true, data: cachedData, cached: true });
  }

  try {
    const [userInfoList, ratingHistory, submissions] = await Promise.all([
      fetchFromCodeforces('user.info', [['handles', handle]]),
      fetchFromCodeforces('user.rating', [['handle', handle]]).catch(() => []),
      fetchFromCodeforces('user.status', [['handle', handle], ['from', '1'], ['count', '1000']]).catch(() => [])
    ]);

    const userInfo = userInfoList && userInfoList.length > 0 ? userInfoList[0] : null;
    if (!userInfo) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const payload = {
      user: userInfo,
      ratingHistory,
      submissions
    };

    setCache(cacheKey, payload);
    return res.json({ success: true, data: payload, cached: false });
  } catch (error) {
    console.error('API Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

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

// Setup Vite server for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();
      try {
        let template = await vite.transformIndexHtml(url, `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Codeforces Account Tracker</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
            </head>
            <body>
              <div id="root"></div>
              <script type="module" src="/src/main.jsx"></script>
            </body>
          </html>
        `);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  app.listen(PORT, () => {
    console.log(`🚀 Codeforces Tracker Dashboard running on http://localhost:${PORT}`);
  });
}

startServer();
