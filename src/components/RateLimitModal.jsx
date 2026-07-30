import React, { useState, useEffect } from 'react';
import { Clock, X, ShieldAlert } from 'lucide-react';

export default function RateLimitModal({ isOpen, onClose, rateLimitData }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const resetTimeIso = rateLimitData?.resetTime;
  const initialSeconds = rateLimitData?.remainingSeconds || 0;

  useEffect(() => {
    if (!isOpen) return;

    function calculateTimeRemaining() {
      if (resetTimeIso) {
        const target = new Date(resetTimeIso).getTime();
        const now = Date.now();
        const diffMs = Math.max(0, target - now);
        const totalSec = Math.floor(diffMs / 1000);

        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;

        setTimeLeft({ hours, minutes, seconds });
      } else if (initialSeconds > 0) {
        const hours = Math.floor(initialSeconds / 3600);
        const minutes = Math.floor((initialSeconds % 3600) / 60);
        const seconds = initialSeconds % 60;

        setTimeLeft({ hours, minutes, seconds });
      }
    }

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [isOpen, resetTimeIso, initialSeconds]);

  if (!isOpen) return null;

  const pad = (n) => String(n).padStart(2, '0');
  const formattedUtcReset = resetTimeIso ? new Date(resetTimeIso).toUTCString() : '00:00:00 UTC Midnight';

  return (
    <div className="cmd-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="cmd-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', padding: '0', overflow: 'hidden', border: '1px solid rgba(239, 68, 68, 0.4)', boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)' }}
      >
        {/* Header */}
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f4f4f5', margin: 0 }}>
                Today's API Rate Limit Reached
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: '0.15rem 0 0 0', fontWeight: 600 }}>
                Server Quota Protection Active
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600, lineHeight: '1.6', marginBottom: '0.5rem' }}>
            Sorry for the inconvenience, my API hit the rate limit.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Today's API rate limit reached in this server. Please wait until the reset time requested below. Server quota will automatically reset at UTC midnight.
          </p>

          {/* Real Countdown Timer Box */}
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              <Clock size={14} style={{ color: 'var(--accent-blue)' }} />
              REAL-TIME RESET COUNTDOWN
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '0.6rem 1rem', borderRadius: '8px', minWidth: '65px' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                  {pad(timeLeft.hours)}
                </span>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>HOURS</div>
              </div>

              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--border-subtle)' }}>:</span>

              <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '0.6rem 1rem', borderRadius: '8px', minWidth: '65px' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                  {pad(timeLeft.minutes)}
                </span>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>MINS</div>
              </div>

              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--border-subtle)' }}>:</span>

              <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '0.6rem 1rem', borderRadius: '8px', minWidth: '65px' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                  {pad(timeLeft.seconds)}
                </span>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SECS</div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem' }}>
              Exact Reset Timestamp: <strong style={{ color: 'var(--text-main)' }}>{formattedUtcReset}</strong>
            </div>
          </div>

          <button
            className="btn-primary-sm"
            onClick={onClose}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.875rem', justifyContent: 'center' }}
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
