# CodeforcesPro Automation Engineering (Make.com & n8n Workflows)

CodeforcesPro uses REST automation webhooks as its operational workflow automation backbone to manage background notifications, streak reminders, and weekly progress digests without bloating the core application codebase.

---

## 🧩 Make.com Scenario Setup Guide

### Available Make.com Blueprints:
1. 📄 **`workflows/make-streak-reminder.json`** — Nightly Streak-at-Risk Notification Scenario.
2. 📄 **`workflows/make-weekly-digest.json`** — Sunday Weekly Progress Digest Scenario.

---

### How to Import Blueprints into Make.com (Integromat)

1. Log in to **[Make.com](https://make.com)** and click **Create a new scenario**.
2. Click the **`...` (More)** menu at the bottom toolbar → Select **Import Blueprint**.
3. Choose `workflows/make-streak-reminder.json` or `workflows/make-weekly-digest.json`.
4. Click **Save** and turn the Scenario ON!

---

## 🛠️ API Webhook Endpoints Used by Make.com

- **Check Streak Risk**: `GET https://codeforces-tracker-nine.vercel.app/api/automation/users-at-risk`
- **Get Weekly Digest**: `GET https://codeforces-tracker-nine.vercel.app/api/automation/weekly-summary/pdineshsampathram`
- **Get Contest Alerts**: `GET https://codeforces-tracker-nine.vercel.app/api/automation/upcoming-contest-alerts`
- **Send Notification**: `POST https://codeforces-tracker-nine.vercel.app/api/automation/send-alert`
