# CodeforcesPro Automation Engineering (n8n Integration)

CodeforcesPro uses **n8n** as its operational workflow automation engine to manage background notifications, streak reminders, and weekly progress digests without bloating the core application codebase.

---

## Architecture Overview

Instead of exposing direct database credentials, CodeforcesPro exposes clean, authenticated REST automation API endpoints (`/api/automation/*`). n8n workflows consume these endpoints via scheduled Cron triggers and dispatch alerts to Discord, Email, or Webhook channels.

```
[ n8n Schedule Trigger ] ---> [ GET /api/automation/users-at-risk ]
                                            |
                                  (Finds streak at risk)
                                            |
                                            v
[ Discord / Email Alert ] <--- [ POST /api/automation/send-alert ]
```

---

## Production Workflows Included

### 1. `workflows/streak-reminder.json`
- **Trigger**: Daily at 8:00 PM UTC (`0 20 * * *`).
- **Endpoint**: `GET /api/automation/users-at-risk`
- **Logic**: Identifies users who have an active streak but have not solved any problem in the last 20+ hours.
- **Action**: Dispatches a high-priority "🔥 Streak At Risk" alert so the user can complete 1 problem before midnight.

### 2. `workflows/weekly-digest.json`
- **Trigger**: Every Sunday at 6:00 PM UTC (`0 18 * * 0`).
- **Endpoint**: `GET /api/automation/weekly-summary/:handle`
- **Logic**: Aggregates the last 7 days of submissions, unique solved counts, max rating achieved, and daily breakdown.
- **Action**: Dispatches a formatted "📊 Weekly CP Progress Report" summary digest.

---

## How to Import Workflows into n8n

1. Open your n8n dashboard (Cloud or self-hosted).
2. Click **Workflows > Import from File**.
3. Select `workflows/streak-reminder.json` or `workflows/weekly-digest.json`.
4. Click **Activate Workflow**.
