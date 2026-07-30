import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, Zap, Sparkles, Check, ExternalLink } from 'lucide-react';

export default function BillingView() {
  const [planInfo, setPlanInfo] = useState(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetch('/api/stripe/user-subscription/u_default')
      .then(res => res.json())
      .then(json => {
        if (json.success) setPlanInfo(json.data);
      })
      .catch(() => null);
  }, []);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'u_default' }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      }
    } catch (err) {
      console.error('Upgrade error:', err);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CreditCard size={22} style={{ color: 'var(--accent-blue)' }} />
          Billing & Pro Plan Settings
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Manage your subscription tier, feature quotas, and billing details.
        </p>
      </div>

      {/* Active Subscription Banner */}
      <div className="ent-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-blue)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="status-badge done" style={{ fontSize: '0.75rem' }}>Active Plan</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                {planInfo?.plan === 'PRO' ? 'CodeforcesPro Pro Tier' : 'CodeforcesPro Free Tier'}
              </h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              {planInfo?.plan === 'PRO'
                ? 'Your account has full access to Nvidia Llama 3.3 70B AI diagnostics, Unlimited Cohorts, and GitHub SVG Badges.'
                : 'You are on the Free Plan. Upgrade to Pro for AI diagnostics, unlimited cohorts, and SVG badges.'}
            </p>
          </div>

          <button className="btn-primary-sm" onClick={handleUpgrade} disabled={upgrading || planInfo?.plan === 'PRO'}>
            <Sparkles size={14} />
            <span>{planInfo?.plan === 'PRO' ? 'Pro Plan Active' : 'Upgrade to Pro ($9/mo)'}</span>
          </button>
        </div>
      </div>

      {/* Included Pro Features List */}
      <div className="ent-card">
        <div className="ent-card-header">
          <h3 className="ent-card-title">Included Tier Capabilities</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <Check size={16} style={{ color: 'var(--accent-green)', marginTop: '0.1rem' }} />
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Nvidia AI Diagnostics Engine</h4>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Llama 3.3 70B live diagnostics and weekly practice plans.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <Check size={16} style={{ color: 'var(--accent-green)', marginTop: '0.1rem' }} />
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Unlimited Cohorts & Teams</h4>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Create and join unlimited practice groups with shared leaderboards.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <Check size={16} style={{ color: 'var(--accent-green)', marginTop: '0.1rem' }} />
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Embeddable GitHub SVG Badges</h4>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Server-side rendered SVG stat cards for profile READMEs.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <Check size={16} style={{ color: 'var(--accent-green)', marginTop: '0.1rem' }} />
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>n8n Automation Webhooks</h4>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Streak-at-risk notifications and weekly summary digests.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
