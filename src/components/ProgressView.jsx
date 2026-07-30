import React, { useState, useEffect, useMemo } from 'react';
import { Target, Flame, Award, CheckCircle2, Lock, Zap, Edit2, Check, X, Calendar } from 'lucide-react';

const GOALS_KEY = 'cf_user_goals';

const DEFAULT_GOALS = {
  daily: 3,
  weekly: 15,
  monthly: 50,
};

function getSavedGoals() {
  try {
    const saved = JSON.parse(localStorage.getItem(GOALS_KEY) || 'null');
    return saved ? { ...DEFAULT_GOALS, ...saved } : DEFAULT_GOALS;
  } catch {
    return DEFAULT_GOALS;
  }
}

function saveGoals(goals) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export default function ProgressView({ submissions }) {
  const [goals, setGoalsState] = useState(getSavedGoals());
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(goals);

  // Filter OK submissions
  const okSubmissions = useMemo(() => {
    return submissions.filter(s => s.verdict === 'OK');
  }, [submissions]);

  // Real timeframe calculations
  const { todaySolves, weekSolves, monthSolves, totalSolved } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
    
    // 7 days ago
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime() / 1000;
    
    // 30 days ago
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime() / 1000;

    const todaySet = new Set();
    const weekSet = new Set();
    const monthSet = new Set();
    const totalSet = new Set();

    okSubmissions.forEach(sub => {
      if (!sub.problem?.contestId || !sub.problem?.index) return;
      const key = `${sub.problem.contestId}-${sub.problem.index}`;
      const time = sub.creationTimeSeconds;

      totalSet.add(key);

      if (time >= startOfToday) {
        todaySet.add(key);
      }
      if (time >= startOfWeek) {
        weekSet.add(key);
      }
      if (time >= startOfMonth) {
        monthSet.add(key);
      }
    });

    return {
      todaySolves: todaySet.size,
      weekSolves: weekSet.size,
      monthSolves: monthSet.size,
      totalSolved: totalSet.size,
    };
  }, [okSubmissions]);

  const handleSaveGoals = () => {
    const updated = {
      daily: Math.max(1, parseInt(editForm.daily) || 1),
      weekly: Math.max(1, parseInt(editForm.weekly) || 1),
      monthly: Math.max(1, parseInt(editForm.monthly) || 1),
    };
    setGoalsState(updated);
    saveGoals(updated);
    setIsEditing(false);
  };

  const badges = [
    { id: 'b1', title: 'First Accepted Solution', desc: 'Solve your first problem on Codeforces', icon: '🏆', unlocked: okSubmissions.length > 0 },
    { id: 'b2', title: '10 Problems Solved', desc: 'Reach 10 unique solved problems', icon: '⚡', unlocked: totalSolved >= 10 },
    { id: 'b3', title: 'Math Specialist', desc: 'Solve 5+ math category problems', icon: '🔢', unlocked: okSubmissions.filter(s => s.problem?.tags?.includes('math')).length >= 5 },
    { id: 'b4', title: 'Greedy Tactician', desc: 'Solve 5+ greedy category problems', icon: '🎯', unlocked: okSubmissions.filter(s => s.problem?.tags?.includes('greedy')).length >= 5 },
    { id: 'b5', title: 'Century Master', desc: 'Solve 100 total problem submissions', icon: '💯', unlocked: submissions.length >= 100 },
    { id: 'b6', title: 'Night Owl Solver', desc: 'Submit solutions after 10 PM', icon: '🦉', unlocked: submissions.some(s => new Date(s.creationTimeSeconds * 1000).getHours() >= 22) }
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Target size={22} style={{ color: 'var(--accent-green)' }} />
            Goals, Streaks & Achievements
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Track practice targets based on live submission timestamps and customize your goals.
          </p>
        </div>

        <button
          className="btn-secondary-sm"
          onClick={() => {
            if (isEditing) {
              handleSaveGoals();
            } else {
              setEditForm(goals);
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? (
            <>
              <Check size={14} style={{ color: 'var(--accent-green)' }} />
              <span>Save Goals</span>
            </>
          ) : (
            <>
              <Edit2 size={13} />
              <span>Customize Goals</span>
            </>
          )}
        </button>
      </div>

      {/* Target Progress Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Daily Card */}
        <div className="ent-card">
          <div className="kpi-header">
            <span className="kpi-title">DAILY TARGET</span>
            <span className={`status-badge ${todaySolves >= goals.daily ? 'done' : ''}`}>
              {todaySolves} / {isEditing ? (
                <input
                  type="number"
                  value={editForm.daily}
                  onChange={e => setEditForm({ ...editForm, daily: e.target.value })}
                  style={{ width: '40px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', borderRadius: '3px', padding: '0 0.2rem', textAlign: 'center' }}
                />
              ) : goals.daily} Today
            </span>
          </div>
          <div className="kpi-value">{todaySolves} Solved</div>
          <div className="kpi-subtext" style={{ marginBottom: '0.5rem' }}>
            Unique problems solved in last 24 hours
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--accent-green)', height: '100%', width: `${Math.min(100, (todaySolves / goals.daily) * 100)}%`, transition: 'var(--transition)' }} />
          </div>
        </div>

        {/* Weekly Card */}
        <div className="ent-card">
          <div className="kpi-header">
            <span className="kpi-title">WEEKLY GOAL (7 DAYS)</span>
            <span className={`status-badge ${weekSolves >= goals.weekly ? 'done' : ''}`}>
              {weekSolves} / {isEditing ? (
                <input
                  type="number"
                  value={editForm.weekly}
                  onChange={e => setEditForm({ ...editForm, weekly: e.target.value })}
                  style={{ width: '45px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', borderRadius: '3px', padding: '0 0.2rem', textAlign: 'center' }}
                />
              ) : goals.weekly} Solved
            </span>
          </div>
          <div className="kpi-value">{weekSolves} Solved</div>
          <div className="kpi-subtext" style={{ marginBottom: '0.5rem' }}>
            Unique problems solved in last 7 days
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--accent-blue)', height: '100%', width: `${Math.min(100, (weekSolves / goals.weekly) * 100)}%`, transition: 'var(--transition)' }} />
          </div>
        </div>

        {/* Monthly Card */}
        <div className="ent-card">
          <div className="kpi-header">
            <span className="kpi-title">MONTHLY GOAL (30 DAYS)</span>
            <span className={`status-badge ${monthSolves >= goals.monthly ? 'done' : ''}`}>
              {monthSolves} / {isEditing ? (
                <input
                  type="number"
                  value={editForm.monthly}
                  onChange={e => setEditForm({ ...editForm, monthly: e.target.value })}
                  style={{ width: '50px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', borderRadius: '3px', padding: '0 0.2rem', textAlign: 'center' }}
                />
              ) : goals.monthly} Target
            </span>
          </div>
          <div className="kpi-value">{monthSolves} Solved</div>
          <div className="kpi-subtext" style={{ marginBottom: '0.5rem' }}>
            Unique problems solved in last 30 days
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--accent-purple)', height: '100%', width: `${Math.min(100, (monthSolves / goals.monthly) * 100)}%`, transition: 'var(--transition)' }} />
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="ent-card">
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <Award size={18} style={{ color: 'var(--accent-orange)' }} />
            Unlockable Achievement Badges
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {badges.map(b => (
            <div 
              key={b.id}
              style={{
                background: b.unlocked ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                border: '1px solid',
                borderColor: b.unlocked ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <div style={{ 
                fontSize: '2rem',
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {b.icon}
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: b.unlocked ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {b.title}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.2rem 0 0.4rem' }}>
                  {b.desc}
                </p>
                <span className={`status-badge ${b.unlocked ? 'done' : ''}`} style={{ fontSize: '0.675rem' }}>
                  {b.unlocked ? '✓ Unlocked' : '🔒 Locked'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
