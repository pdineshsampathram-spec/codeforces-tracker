import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In Vercel serverless /tmp or local project directory
const DATA_DIR = process.env.VERCEL ? '/tmp/.data' : path.join(__dirname, '../.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadDb() {
  try {
    ensureDirectoryExists(DATA_DIR);
    if (!fs.existsSync(DB_FILE)) {
      const initialSchema = {
        users: [
          {
            id: 'u_default',
            email: 'default@codeforcespro.app',
            created_at: new Date().toISOString(),
          }
        ],
        linked_handles: [
          {
            id: 'lh_default',
            user_id: 'u_default',
            handle: process.env.DEFAULT_HANDLE || 'pdineshsampathram',
            created_at: new Date().toISOString(),
          }
        ],
        submission_snapshots: {},
        sync_log: [],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialSchema, null, 2));
      return initialSchema;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading DB file:', err);
    return {
      users: [],
      linked_handles: [],
      submission_snapshots: {},
      sync_log: [],
    };
  }
}

function saveDb(data) {
  try {
    ensureDirectoryExists(DATA_DIR);
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

// Public DB API
export const db = {
  // 1. Users & Linked Handles
  getUsers() {
    const data = loadDb();
    return data.users || [];
  },

  getLinkedHandles() {
    const data = loadDb();
    return data.linked_handles || [];
  },

  linkHandle(handle, userId = 'u_default') {
    const data = loadDb();
    const cleanHandle = handle.trim().toLowerCase();
    const existing = data.linked_handles.find(lh => lh.handle.toLowerCase() === cleanHandle);
    if (!existing) {
      data.linked_handles.push({
        id: `lh_${Date.now()}`,
        user_id: userId,
        handle: handle.trim(),
        created_at: new Date().toISOString(),
      });
      saveDb(data);
    }
    return data.linked_handles;
  },

  // 2. Submission Snapshots (Upsert)
  upsertSubmissions(handle, submissions) {
    const data = loadDb();
    const hKey = handle.toLowerCase();
    if (!data.submission_snapshots[hKey]) {
      data.submission_snapshots[hKey] = {};
    }

    let upsertedCount = 0;
    const now = new Date().toISOString();

    submissions.forEach(sub => {
      if (!sub.id) return;
      const subKey = `sub_${sub.id}`;
      const isNew = !data.submission_snapshots[hKey][subKey];

      data.submission_snapshots[hKey][subKey] = {
        id: subKey,
        handle: handle,
        submission_id: sub.id,
        contest_id: sub.problem?.contestId || null,
        problem_index: sub.problem?.index || null,
        problem_name: sub.problem?.name || 'Unknown',
        problem_rating: sub.problem?.rating || null,
        problem_tags: sub.problem?.tags || [],
        verdict: sub.verdict || 'UNKNOWN',
        programming_language: sub.programmingLanguage || 'Unknown',
        creation_time_seconds: sub.creationTimeSeconds,
        snapshot_at: isNew ? now : (data.submission_snapshots[hKey][subKey].snapshot_at || now),
        updated_at: now,
      };

      if (isNew) upsertedCount++;
    });

    saveDb(data);
    return upsertedCount;
  },

  getStoredSubmissions(handle) {
    const data = loadDb();
    const hKey = handle.toLowerCase();
    const map = data.submission_snapshots[hKey] || {};
    return Object.values(map).sort((a, b) => b.creation_time_seconds - a.creation_time_seconds);
  },

  // 3. Historical Trends Query
  getHistoricalTrends(handle, days = 30) {
    const subs = this.getStoredSubmissions(handle);
    const nowSec = Math.floor(Date.now() / 1000);
    const limitSec = days * 86400;

    const filtered = subs.filter(s => (nowSec - s.creation_time_seconds) <= limitSec);

    // Aggregate by day
    const dailyMap = new Map();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      dailyMap.set(dStr, { total: 0, ok: 0 });
    }

    filtered.forEach(sub => {
      const dStr = new Date(sub.creation_time_seconds * 1000).toISOString().split('T')[0];
      if (dailyMap.has(dStr)) {
        const item = dailyMap.get(dStr);
        item.total += 1;
        if (sub.verdict === 'OK') item.ok += 1;
      }
    });

    const labels = [];
    const totalData = [];
    const okData = [];

    dailyMap.forEach((val, key) => {
      const displayLabel = new Date(key + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      labels.push(displayLabel);
      totalData.push(val.total);
      okData.push(val.ok);
    });

    return {
      labels,
      totalData,
      okData,
      totalSubmissionsInRange: filtered.length,
      okSubmissionsInRange: filtered.filter(s => s.verdict === 'OK').length,
    };
  },

  // 4. Sync Log
  recordSyncLog(handle, status, submissionsCount = 0, errorMessage = null) {
    const data = loadDb();
    if (!data.sync_log) data.sync_log = [];

    const entry = {
      id: `log_${Date.now()}`,
      handle,
      status, // 'SUCCESS' | 'FAILED'
      submissions_count: submissionsCount,
      error_message: errorMessage,
      synced_at: new Date().toISOString(),
    };

    data.sync_log.unshift(entry);
    // Keep last 100 log entries
    data.sync_log = data.sync_log.slice(0, 100);
    saveDb(data);

    return entry;
  },

  getSyncLog(handle = null) {
    const data = loadDb();
    const logs = data.sync_log || [];
    if (handle) {
      return logs.filter(l => l.handle.toLowerCase() === handle.toLowerCase());
    }
    return logs;
  }
};
