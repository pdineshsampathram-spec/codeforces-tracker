import { db } from './db.js';

export function setupAuthAndCohortRoutes(app) {
  // 1. Linked Handles endpoints
  app.get('/api/user-handles/:userId', (req, res) => {
    const { userId } = req.params;
    const handles = db.getLinkedHandles(userId);
    return res.json({ success: true, data: handles });
  });

  app.post('/api/user-handles/link', (req, res) => {
    const { handle, userId = 'u_default' } = req.body;
    if (!handle) return res.status(400).json({ success: false, error: 'Handle required' });
    const entry = db.linkHandle(handle, userId);
    return res.json({ success: true, data: entry });
  });

  app.post('/api/user-handles/remove', (req, res) => {
    const { handle, userId = 'u_default' } = req.body;
    if (!handle) return res.status(400).json({ success: false, error: 'Handle required' });
    const remaining = db.removeLinkedHandle(handle, userId);
    return res.json({ success: true, data: remaining });
  });

  // 2. Cohorts & Teams endpoints
  app.get('/api/cohorts', (req, res) => {
    const cohorts = db.getCohorts();
    return res.json({ success: true, data: cohorts });
  });

  app.post('/api/cohorts/create', (req, res) => {
    const { name, description = '', userId = 'u_default' } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Cohort name required' });
    const newCohort = db.createCohort(name, description, userId);
    return res.json({ success: true, data: newCohort });
  });

  app.post('/api/cohorts/join', (req, res) => {
    const { code, handle } = req.body;
    if (!code || !handle) return res.status(400).json({ success: false, error: 'Code and Handle required' });
    try {
      const cohort = db.joinCohort(code, handle);
      return res.json({ success: true, data: cohort });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/cohorts/:id/leaderboard', async (req, res) => {
    const { id } = req.params;
    const members = db.getCohortMembers(id);

    // Build leaderboard from members' stored data / Codeforces stats
    const leaderboard = await Promise.all(
      members.map(async (m) => {
        const storedSubs = db.getStoredSubmissions(m.handle);
        const okSubs = storedSubs.filter(s => s.verdict === 'OK');
        const uniqueSolved = new Set(okSubs.map(s => `${s.contest_id}-${s.problem_index}`)).size;
        const maxRating = okSubs.length > 0 ? Math.max(...okSubs.map(s => s.problem_rating || 0)) : 0;

        return {
          handle: m.handle,
          joinedAt: m.joined_at,
          totalSubmissions: storedSubs.length,
          uniqueSolved,
          maxRating,
        };
      })
    );

    // Sort by unique solved descending, then max rating
    leaderboard.sort((a, b) => b.uniqueSolved - a.uniqueSolved || b.maxRating - a.maxRating);

    return res.json({ success: true, data: leaderboard });
  });
}
