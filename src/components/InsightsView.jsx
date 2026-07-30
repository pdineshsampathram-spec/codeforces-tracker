import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Zap, Target, Lightbulb, CheckCircle2, RefreshCw, Send, Bot, User } from 'lucide-react';

function renderSafeText(val, fallback = '') {
  if (val === null || val === undefined) return fallback;

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return renderSafeText(parsed, fallback);
      } catch {
        return val;
      }
    }
    return val;
  }

  if (typeof val === 'number') return String(val);
  
  if (Array.isArray(val)) {
    if (val.length === 0) return fallback;
    const items = val.map(item => {
      if (typeof item === 'string' || typeof item === 'number') return String(item);
      if (typeof item === 'object' && item !== null) {
        return item.topic || item.TOPIC || item.name || item.title || item.tag || JSON.stringify(item);
      }
      return String(item);
    });
    return items.join(', ');
  }

  if (typeof val === 'object') {
    if (val.summary) return String(val.summary);
    if (val.description) return String(val.description);
    if (val.text) return String(val.text);
    if (val.passRate !== undefined) return `${val.passRate}% pass rate across ${val.total || 0} submissions`;
    return JSON.stringify(val);
  }
  return String(val);
}

export default function InsightsView({ submissions = [], user = null }) {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const safeSubmissions = Array.isArray(submissions) ? submissions : [];
  const userHandle = user?.handle || 'pdineshsampathram';

  const fetchAiInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: userHandle, submissions: safeSubmissions }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAiData(json.data);
      }
    } catch (err) {
      console.error('AI Insights Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiInsights();
  }, [userHandle]);

  const handleSendQuestion = async (e) => {
    e.preventDefault();
    if (!chatQuestion.trim() || chatLoading) return;

    const q = chatQuestion.trim();
    setChatQuestion('');
    setChatHistory(prev => [...prev, { role: 'user', content: q }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: userHandle, submissions: safeSubmissions, question: q }),
      });
      const json = await res.json();
      if (json.success && json.answer) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: renderSafeText(json.answer) }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Apologies, I could not generate a response right now. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const totalSubmissions = safeSubmissions.length;
  const okSubmissions = safeSubmissions.filter(s => s?.verdict === 'OK' || s?.verdict === 'Accepted');
  const passRate = totalSubmissions > 0 ? ((okSubmissions.length / totalSubmissions) * 100).toFixed(1) : '0.0';

  // Defensive array checks
  const diagnosticItems = Array.isArray(aiData?.diagnosticSummary) ? aiData.diagnosticSummary : [];
  const recommendedPlans = Array.isArray(aiData?.recommendedPlan) ? aiData.recommendedPlan : [];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={22} style={{ color: 'var(--accent-purple)' }} />
            AI Performance Diagnostics & Skill Insights
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Live LLM analysis powered by Nvidia Llama 8B & your real Codeforces telemetry.
          </p>
        </div>

        <button
          className="btn-secondary-sm"
          onClick={fetchAiInsights}
          disabled={loading}
        >
          <RefreshCw size={13} className={loading ? 'spinner' : ''} />
          <span>{loading ? 'Analyzing...' : 'Regenerate AI Diagnostics'}</span>
        </button>
      </div>

      {/* KPI Insight Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Card 1 */}
        <div className="ent-card" style={{ borderLeft: '3px solid var(--accent-purple)' }}>
          <div className="kpi-header">
            <span className="kpi-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={14} style={{ color: 'var(--accent-purple)' }} />
              TOP STRENGTH TOPICS
            </span>
            <span className="status-badge done">Strongest</span>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.3rem', color: 'var(--accent-purple)', textTransform: 'uppercase' }}>
            {renderSafeText(aiData?.strongestTopics, 'Math & Greedy')}
          </div>
          <div className="kpi-subtext">
            Highest first-attempt success rate based on historical submissions.
          </div>
        </div>

        {/* Card 2 */}
        <div className="ent-card" style={{ borderLeft: '3px solid var(--accent-green)' }}>
          <div className="kpi-header">
            <span className="kpi-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Target size={14} style={{ color: 'var(--accent-green)' }} />
              RECOMMENDED NEXT TARGET
            </span>
            <span className="status-badge done">Target</span>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.3rem', color: 'var(--accent-green)' }}>
            ★ {renderSafeText(aiData?.nextTargetRating, '1300')} Rating
          </div>
          <div className="kpi-subtext">
            Data-backed problem difficulty target to maximize rating growth.
          </div>
        </div>

        {/* Card 3 */}
        <div className="ent-card" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
          <div className="kpi-header">
            <span className="kpi-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={14} style={{ color: 'var(--accent-blue)' }} />
              PASS ACCURACY RATE
            </span>
            <span className="status-badge" style={{ background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
              {passRate}% AC
            </span>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.3rem', color: 'var(--text-main)' }}>
            {okSubmissions.length} of {totalSubmissions} AC
          </div>
          <div className="kpi-subtext">
            {renderSafeText(aiData?.passRateSummary, 'Your accepted solution ratio is stable across sets.')}
          </div>
        </div>
      </div>

      {/* Diagnostic Summary */}
      <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <Lightbulb size={18} style={{ color: 'var(--accent-amber)' }} />
            Live AI Diagnostic Summary
          </h3>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
            Engine: Nvidia Llama Telemetry Model
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 0.75rem', width: '20px', height: '20px', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-purple)', borderRadius: '50%' }} />
            Analyzing real solve telemetry...
          </div>
        ) : diagnosticItems.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {diagnosticItems.map((item, idx) => (
              <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.85rem' }}>
                <CheckCircle2 size={18} style={{ color: idx === 0 ? 'var(--accent-green)' : idx === 1 ? 'var(--accent-blue)' : 'var(--accent-orange)', flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.2rem' }}>{renderSafeText(item?.title, 'Diagnostic Point')}</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {renderSafeText(item?.description, '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Click "Regenerate AI Diagnostics" above to generate diagnostic analytics for handle <strong>{userHandle}</strong>.
          </div>
        )}
      </div>

      {/* Recommended 7-Day Practice Plan */}
      {recommendedPlans.length > 0 && (
        <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
          <div className="ent-card-header">
            <h3 className="ent-card-title">
              <Target size={18} style={{ color: 'var(--accent-green)' }} />
              AI Recommended Weekly Practice Schedule
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {recommendedPlans.map((plan, i) => (
              <div key={i} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <span className="status-badge done" style={{ fontSize: '0.675rem', marginBottom: '0.5rem' }}>{renderSafeText(plan?.day, `Step ${i + 1}`)}</span>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.3rem 0 0.2rem' }}>{renderSafeText(plan?.focus, 'Practice Focus')}</h4>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{renderSafeText(plan?.detail, '')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Natural Language Practice Assistant Chat */}
      <div className="ent-card">
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <Bot size={18} style={{ color: 'var(--accent-blue)' }} />
            Ask CP AI Assistant
          </h3>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
            Ask anything about your practice strategy or weak topics
          </span>
        </div>

        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', maxHeight: '300px', overflowY: 'auto', padding: '0.5rem' }}>
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--accent-blue-subtle)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={14} style={{ color: 'var(--accent-blue)' }} />
                  </div>
                )}
                <div
                  style={{
                    background: msg.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-input)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.825rem',
                    lineHeight: '1.6',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  {renderSafeText(msg.content)}
                </div>
                {msg.role === 'user' && (
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Form Input */}
        <form onSubmit={handleSendQuestion} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="cmd-input"
            placeholder="e.g. What topics should I practice before my next Div 2 contest?"
            value={chatQuestion}
            onChange={(e) => setChatQuestion(e.target.value)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.55rem 0.85rem',
              fontSize: '0.85rem',
              flex: 1,
            }}
          />
          <button type="submit" className="btn-primary-sm" disabled={chatLoading || !chatQuestion.trim()}>
            {chatLoading ? <RefreshCw size={13} className="spinner" /> : <Send size={13} />}
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
}
