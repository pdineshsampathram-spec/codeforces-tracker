import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Coffee, Zap, Timer, ChevronDown } from 'lucide-react';

const PRESETS = [
  { label: 'Focus', minutes: 25, type: 'work' },
  { label: 'Short Break', minutes: 5, type: 'break' },
  { label: 'Long Break', minutes: 15, type: 'break' },
  { label: 'Deep Work', minutes: 50, type: 'work' },
];

const SESSION_LOG_KEY = 'cf_focus_sessions';

function getSessionLog() {
  try { return JSON.parse(localStorage.getItem(SESSION_LOG_KEY) || '[]'); }
  catch { return []; }
}

function logSession(session) {
  const log = getSessionLog();
  log.unshift(session);
  localStorage.setItem(SESSION_LOG_KEY, JSON.stringify(log.slice(0, 50)));
}

export default function FocusMode({ isActive, onClose, onSessionComplete }) {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showPresets, setShowPresets] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const resetTimer = useCallback((newPreset) => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const p = newPreset || preset;
    setPreset(p);
    setTimeLeft(p.minutes * 60);
  }, [preset]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setCompletedSessions(c => c + 1);

            logSession({
              type: preset.type,
              duration: preset.minutes,
              completedAt: new Date().toISOString(),
            });

            onSessionComplete?.(preset.type === 'work'
              ? 'Focus session complete! Time for a break.'
              : 'Break over! Ready to focus again.');

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft, preset, onSessionComplete]);

  useEffect(() => {
    if (!isActive) {
      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isActive]);

  if (!isActive) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - (timeLeft / (preset.minutes * 60));
  const circumference = 2 * Math.PI * 120;
  const offset = circumference * (1 - progress);

  const todaySessions = getSessionLog().filter(s => {
    const d = new Date(s.completedAt);
    const today = new Date();
    return d.toDateString() === today.toDateString() && s.type === 'work';
  }).length;

  return (
    <div className="focus-overlay">
      <div className="focus-panel">
        {/* Header */}
        <div className="focus-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Zap size={18} style={{ color: preset.type === 'work' ? 'var(--accent-blue)' : 'var(--accent-green)' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Focus Mode</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              {todaySessions} sessions today
            </span>
            <button className="shortcuts-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Timer Ring */}
        <div className="focus-timer-container">
          <svg width="260" height="260" viewBox="0 0 260 260" className="focus-ring">
            {/* Background ring */}
            <circle
              cx="130" cy="130" r="120"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="4"
            />
            {/* Progress ring */}
            <circle
              cx="130" cy="130" r="120"
              fill="none"
              stroke={preset.type === 'work' ? 'var(--accent-blue)' : 'var(--accent-green)'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 130 130)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="focus-timer-display">
            <div className="focus-time">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="focus-preset-label">
              {preset.label}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="focus-controls">
          <button
            className="focus-btn secondary"
            onClick={() => resetTimer()}
            title="Reset"
          >
            <RotateCcw size={16} />
          </button>

          <button
            className={`focus-btn primary ${isRunning ? 'running' : ''}`}
            onClick={() => {
              if (!isRunning) startTimeRef.current = Date.now();
              setIsRunning(!isRunning);
            }}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            <span>{isRunning ? 'Pause' : 'Start'}</span>
          </button>

          <div style={{ position: 'relative' }}>
            <button
              className="focus-btn secondary"
              onClick={() => setShowPresets(!showPresets)}
              title="Change timer"
            >
              <Timer size={16} />
              <ChevronDown size={12} />
            </button>

            {showPresets && (
              <div className="focus-presets-dropdown">
                {PRESETS.map((p, i) => (
                  <button
                    key={i}
                    className={`focus-preset-item ${p.label === preset.label ? 'active' : ''}`}
                    onClick={() => {
                      resetTimer(p);
                      setShowPresets(false);
                    }}
                  >
                    {p.type === 'work' ? <Zap size={13} /> : <Coffee size={13} />}
                    <span>{p.label}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      {p.minutes}m
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Session stats */}
        <div className="focus-stats">
          <div className="focus-stat">
            <span className="focus-stat-value">{completedSessions}</span>
            <span className="focus-stat-label">This session</span>
          </div>
          <div className="focus-stat-divider" />
          <div className="focus-stat">
            <span className="focus-stat-value">{todaySessions}</span>
            <span className="focus-stat-label">Today total</span>
          </div>
          <div className="focus-stat-divider" />
          <div className="focus-stat">
            <span className="focus-stat-value">{todaySessions * 25}m</span>
            <span className="focus-stat-label">Focus time</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
            Press <kbd className="shortcuts-kbd" style={{ fontSize: '0.6rem' }}>F</kbd> to toggle · <kbd className="shortcuts-kbd" style={{ fontSize: '0.6rem' }}>Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
