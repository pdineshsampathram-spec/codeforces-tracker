import { db } from './db.js';

export function setupAutomationRoutes(app) {
  // 1. Streak-at-risk detection endpoint (for n8n Cron Trigger)
  app.get('/api/automation/users-at-risk', (req, res) => {
    const handles = db.getLinkedHandles();
    const nowSec = Math.floor(Date.now() / 1000);
    const atRisk = [];

    handles.forEach(lh => {
      const subs = db.getStoredSubmissions(lh.handle);
      const okSubs = subs.filter(s => s.verdict === 'OK');
      if (okSubs.length === 0) return;

      const lastOk = okSubs[0]; // Most recent solve
      const hoursSinceLastSolve = (nowSec - lastOk.creation_time_seconds) / 3600;

      // At risk if no solve in 20-30 hours and previously had activity
      if (hoursSinceLastSolve >= 20 && hoursSinceLastSolve <= 48) {
        atRisk.push({
          handle: lh.handle,
          hoursSinceLastSolve: Math.round(hoursSinceLastSolve),
          lastSolvedProblem: lastOk.problem_name,
          lastSolvedTime: new Date(lastOk.creation_time_seconds * 1000).toISOString(),
        });
      }
    });

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      atRiskCount: atRisk.length,
      usersAtRisk: atRisk,
    });
  });

  // 2. Weekly summary digest generator (for n8n Weekly Digest workflow)
  app.get('/api/automation/weekly-summary/:handle', (req, res) => {
    const { handle } = req.params;
    const history = db.getHistoricalTrends(handle, 7);
    const storedSubs = db.getStoredSubmissions(handle);

    const weekOkSubs = storedSubs.filter(s => {
      const isOk = s.verdict === 'OK';
      const isPastWeek = (Math.floor(Date.now() / 1000) - s.creation_time_seconds) <= 7 * 86400;
      return isOk && isPastWeek;
    });

    const uniqueSolved = new Set(weekOkSubs.map(s => `${s.contest_id}-${s.problem_index}`)).size;
    const ratings = weekOkSubs.map(s => s.problem_rating).filter(Boolean);
    const maxRating = ratings.length > 0 ? Math.max(...ratings) : 800;

    return res.json({
      success: true,
      handle,
      weekRange: 'Past 7 Days',
      uniqueSolved,
      totalSubmissions: history.totalSubmissionsInRange,
      maxRatingSolved: maxRating,
      dailyBreakdown: history.labels.map((lbl, idx) => ({
        day: lbl,
        solvedCount: history.okData[idx],
        totalAttempted: history.totalData[idx],
      })),
      digestMessage: `📊 Weekly CP Progress for ${handle}: You solved ${uniqueSolved} unique problems this week (Max rating: ${maxRating}). Keep up the momentum!`,
    });
  });

  // 3. Contest reminder alerts endpoint
  app.get('/api/automation/upcoming-contest-alerts', async (req, res) => {
    try {
      const response = await fetch('https://codeforces.com/api/contest.list?gym=false');
      const json = await response.json();
      if (json.status !== 'OK') throw new Error('Codeforces API Error');

      const nowSec = Math.floor(Date.now() / 1000);
      const upcoming = json.result.filter(c => c.phase === 'BEFORE');

      // Alerts for contests starting within 6 hours
      const startingSoon = upcoming.filter(c => {
        const secondsUntilStart = c.startTimeSeconds - nowSec;
        return secondsUntilStart > 0 && secondsUntilStart <= 6 * 3600;
      });

      return res.json({
        success: true,
        startingSoonCount: startingSoon.length,
        contests: startingSoon.map(c => ({
          id: c.id,
          name: c.name,
          startTimeISO: new Date(c.startTimeSeconds * 1000).toISOString(),
          minutesUntilStart: Math.round((c.startTimeSeconds - nowSec) / 60),
        })),
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Webhook Dispatcher (Discord / Custom Webhook integration)
  app.post('/api/automation/send-alert', async (req, res) => {
    const { webhookUrl, message, title = 'CodeforcesPro Automation Alert' } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'Message required' });

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [
              {
                title,
                description: message,
                color: 3881462, // Blue accent
                timestamp: new Date().toISOString(),
                footer: { text: 'CodeforcesPro Automation Engine (n8n Integration)' },
              }
            ]
          })
        });
        return res.json({ success: true, dispatched: true, target: 'Discord Webhook' });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    return res.json({ success: true, dispatched: false, note: 'Alert payload generated locally', title, message });
  });
}
