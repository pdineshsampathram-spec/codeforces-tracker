import React, { useState } from 'react';
import { Sparkles, Trophy, ShieldCheck, Zap, ArrowRight, Check, Star, Users2, BarChart3, Bot } from 'lucide-react';

export default function LandingPage({ onLaunchApp }) {
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgradeToPro = async () => {
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
      console.error('Checkout error:', err);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div style={{ background: '#09090b', color: '#f4f4f5', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      {/* Top Nav Header */}
      <header style={{ borderBottom: '1px solid #27272a', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#3b82f6', color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>CF</div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Codeforces <span style={{ color: '#a1a1aa', fontWeight: 400 }}>Pro</span></span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a href="#pricing" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Pricing</a>
          <button className="btn-primary-sm" onClick={onLaunchApp}>
            <span>Launch Dashboard</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1000px', margin: '4rem auto 3rem', textAlign: 'center', padding: '0 1.5rem' }}>
        <span className="status-badge done" style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem', marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={13} />
          POWERED BY NVIDIA LLAMA 3.3 70B & MULTI-TENANT AUTOMATION
        </span>

        <h1 style={{ fontSize: '3.25rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1.25rem' }}>
          Enterprise CP Analytics <br />
          <span style={{ color: 'var(--accent-blue)' }}>Designed for Peak Performance</span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: '#a1a1aa', maxWidth: '700px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
          Track rating growth, generate live AI problem-solving diagnostics, manage practice cohorts, and display verified GitHub README badges.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-primary-sm" style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }} onClick={onLaunchApp}>
            <span>Open Tracker Platform</span>
            <ArrowRight size={16} />
          </button>
          <button className="btn-secondary-sm" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }} onClick={handleUpgradeToPro}>
            <span>Upgrade to Pro ($9/mo)</span>
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ maxWidth: '1100px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <div className="ent-card" style={{ padding: '1.5rem' }}>
            <Bot size={24} style={{ color: 'var(--accent-purple)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Nvidia AI Diagnostics</h3>
            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', lineHeight: '1.6' }}>
              Real LLM diagnostics powered by Llama 3.3 70B analyzing your rating trajectory, topic strengths, and weak tags.
            </p>
          </div>

          <div className="ent-card" style={{ padding: '1.5rem' }}>
            <Users2 size={24} style={{ color: 'var(--accent-blue)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cohorts & Study Groups</h3>
            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', lineHeight: '1.6' }}>
              Create teams for coding clubs or university DSA classes with shared live group leaderboards and invite codes.
            </p>
          </div>

          <div className="ent-card" style={{ padding: '1.5rem' }}>
            <ShieldCheck size={24} style={{ color: 'var(--accent-green)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Embeddable GitHub Badges</h3>
            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', lineHeight: '1.6' }}>
              Dynamic server-side SVG badges for your GitHub profile README that update automatically with your stats.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Matrix */}
      <section id="pricing" style={{ maxWidth: '900px', margin: '4rem auto 6rem', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Simple, Transparent Pricing</h2>
          <p style={{ color: '#a1a1aa' }}>Unlock the full enterprise competitive programming workspace.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Free Tier */}
          <div className="ent-card" style={{ padding: '2rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#71717a' }}>FREE PLAN</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0' }}>$0 <span style={{ fontSize: '0.9rem', color: '#a1a1aa', fontWeight: 400 }}>/ forever</span></div>
            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '1.5rem' }}>Essential tracking for individual competitive programmers.</p>

            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '2rem' }}>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Check size={14} style={{ color: 'var(--accent-green)' }} /> 1 Linked Codeforces Handle</li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Check size={14} style={{ color: 'var(--accent-green)' }} /> Solved Explorer & Submissions Log</li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Check size={14} style={{ color: 'var(--accent-green)' }} /> Basic Analytics Charts & Heatmap</li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Check size={14} style={{ color: 'var(--accent-green)' }} /> Focus Mode Pomodoro Timer</li>
            </ul>

            <button className="btn-secondary-sm" style={{ width: '100%', padding: '0.65rem' }} onClick={onLaunchApp}>
              Current Free Plan
            </button>
          </div>

          {/* Pro Tier */}
          <div className="ent-card" style={{ padding: '2rem', border: '1px solid var(--accent-blue)', background: 'rgba(59, 130, 246, 0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-blue)' }}>PRO PLAN</span>
              <span className="status-badge done">Recommended</span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0' }}>$9 <span style={{ fontSize: '0.9rem', color: '#a1a1aa', fontWeight: 400 }}>/ month</span></div>
            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '1.5rem' }}>Full AI diagnostics, cohorts, multi-platform & automations.</p>

            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: '#f4f4f5', marginBottom: '2rem' }}>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Check size={14} style={{ color: 'var(--accent-blue)' }} /> <strong>Nvidia Llama 3.3 70B AI Diagnostics</strong></li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Check size={14} style={{ color: 'var(--accent-blue)' }} /> Unlimited Practice Cohorts & Leaderboards</li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Check size={14} style={{ color: 'var(--accent-blue)' }} /> Multi-Platform (LeetCode + Codeforces)</li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Check size={14} style={{ color: 'var(--accent-blue)' }} /> Embeddable GitHub README SVG Badges</li>
              <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Check size={14} style={{ color: 'var(--accent-blue)' }} /> n8n Automation Workflows & Webhooks</li>
            </ul>

            <button className="btn-primary-sm" style={{ width: '100%', padding: '0.65rem' }} onClick={handleUpgradeToPro} disabled={upgrading}>
              {upgrading ? 'Processing Checkout...' : 'Upgrade to Pro Tier'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
