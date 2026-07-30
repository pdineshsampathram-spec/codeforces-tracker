import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// User Subscription Store
const subscriptionsStore = new Map();

export function getUserPlan(userId = 'u_default') {
  return subscriptionsStore.get(userId) || {
    plan: 'PRO', // Default unlocked demo mode or FREE
    status: 'active',
    features: {
      aiDiagnostics: true,
      cohortsLimit: 10,
      multiPlatform: true,
      dataExport: true,
    }
  };
}

export function setupStripeRoutes(app) {
  // 1. Get User Subscription Plan
  app.get('/api/stripe/user-subscription/:userId', (req, res) => {
    const { userId } = req.params;
    const planInfo = getUserPlan(userId);
    return res.json({ success: true, data: planInfo });
  });

  // 2. Create Stripe Checkout Session for $9/mo Pro Tier
  app.post('/api/stripe/create-checkout-session', async (req, res) => {
    const { userId = 'u_default', email = 'user@codeforcespro.app' } = req.body;

    if (STRIPE_SECRET_KEY) {
      try {
        const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-parse-urlencoded',
          },
          body: new URLSearchParams({
            'mode': 'subscription',
            'customer_email': email,
            'line_items[0][price_data][currency]': 'usd',
            'line_items[0][price_data][product_data][name]': 'CodeforcesPro Pro Subscription',
            'line_items[0][price_data][product_data][description]': 'AI diagnostics, unlimited team cohorts, multi-platform aggregation, and historical snapshots.',
            'line_items[0][price_data][recurring][interval]': 'month',
            'line_items[0][price_data][unit_amount]': '900', // $9.00
            'success_url': 'https://codeforces-tracker-nine.vercel.app/?session_id={CHECKOUT_SESSION_ID}&upgraded=true',
            'cancel_url': 'https://codeforces-tracker-nine.vercel.app/',
          }).toString()
        });

        const session = await response.json();
        return res.json({ success: true, url: session.url });
      } catch (err) {
        console.error('Stripe Error:', err);
      }
    }

    // Direct upgrade mode if Stripe key not configured
    subscriptionsStore.set(userId, {
      plan: 'PRO',
      status: 'active',
      upgradedAt: new Date().toISOString(),
      features: {
        aiDiagnostics: true,
        cohortsLimit: 100,
        multiPlatform: true,
        dataExport: true,
      }
    });

    return res.json({
      success: true,
      url: '/?upgraded=true',
      note: 'Upgraded to Pro Tier directly',
    });
  });
}
