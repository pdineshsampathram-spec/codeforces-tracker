import React, { useMemo } from 'react';
import { Calendar, Flame, Award } from 'lucide-react';

export default function ActivityHeatmap({ submissions }) {
  const {
    weeks,
    monthLabels,
    totalPastYearSubmissions,
    activeDaysCount,
    currentStreak,
    longestStreak,
  } = useMemo(() => {
    // Map dates to submission counts
    const dateCounts = new Map();
    submissions.forEach(sub => {
      if (!sub.creationTimeSeconds) return;
      const d = new Date(sub.creationTimeSeconds * 1000);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      dateCounts.set(dateStr, (dateCounts.get(dateStr) || 0) + 1);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // End on Saturday of current week to complete the grid
    const endDate = new Date(today);
    const dayOfWeek = endDate.getDay(); // 0 = Sun, 6 = Sat
    endDate.setDate(endDate.getDate() + (6 - dayOfWeek));

    // Generate 53 weeks (371 days) back from endDate
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (53 * 7 - 1));

    const weeksList = [];
    let currentWeek = [];
    const monthsHeader = [];
    let lastMonth = -1;

    let totalSubs = 0;
    let activeDays = 0;

    const currDate = new Date(startDate);
    let dayIndex = 0;

    while (currDate <= endDate) {
      const dateStr = currDate.toISOString().split('T')[0];
      const count = dateCounts.get(dateStr) || 0;
      const month = currDate.getMonth();

      if (currDate <= today) {
        totalSubs += count;
        if (count > 0) activeDays++;
      }

      // Record month label at start of first week of a month
      if (currDate.getDay() === 0) {
        if (month !== lastMonth) {
          const monthName = currDate.toLocaleDateString('en-US', { month: 'short' });
          monthsHeader.push({ weekIndex: weeksList.length, label: monthName });
          lastMonth = month;
        }
      }

      currentWeek.push({
        dateStr,
        date: new Date(currDate),
        count: currDate <= today ? count : 0,
        isFuture: currDate > today,
      });

      if (currentWeek.length === 7) {
        weeksList.push(currentWeek);
        currentWeek = [];
      }

      currDate.setDate(currDate.getDate() + 1);
      dayIndex++;
    }

    if (currentWeek.length > 0) {
      weeksList.push(currentWeek);
    }

    // Calculate streaks
    let currStreak = 0;
    let maxStreak = 0;
    let checkDate = new Date(today);

    // If no submissions today, check if yesterday had submissions
    const todayStr = checkDate.toISOString().split('T')[0];
    if (!dateCounts.get(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (dateCounts.get(dStr)) {
        currStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Longest streak in 365 days
    let tempStreak = 0;
    const scanDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const dStr = scanDate.toISOString().split('T')[0];
      if (dateCounts.get(dStr)) {
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
      scanDate.setDate(scanDate.getDate() - 1);
    }

    return {
      weeks: weeksList,
      monthLabels: monthsHeader,
      totalPastYearSubmissions: totalSubs,
      activeDaysCount: activeDays,
      currentStreak: currStreak,
      longestStreak: maxStreak,
    };
  }, [submissions]);

  // Heatmap color scaling
  const getCellColor = (count, isFuture) => {
    if (isFuture) return 'rgba(255, 255, 255, 0.02)';
    if (count === 0) return '#18181b';
    if (count <= 2) return 'rgba(34, 197, 94, 0.3)';
    if (count <= 5) return 'rgba(34, 197, 94, 0.55)';
    if (count <= 8) return 'rgba(34, 197, 94, 0.8)';
    return '#22c55e';
  };

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
      <div className="ent-card-header">
        <h3 className="ent-card-title">
          <Calendar size={16} style={{ color: 'var(--accent-green)' }} />
          Submission Activity Heatmap
        </h3>

        {/* Real Streak & Activity Stats */}
        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Flame size={13} style={{ color: 'var(--accent-orange)' }} />
            Current Streak: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{currentStreak} days</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Award size={13} style={{ color: 'var(--accent-amber)' }} />
            Longest: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{longestStreak} days</strong>
          </span>
          <span>
            Active Days: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{activeDaysCount}</strong>
          </span>
        </div>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <div style={{ minWidth: '760px' }}>
          {/* Month Headers */}
          <div style={{ display: 'flex', marginLeft: '32px', marginBottom: '6px', fontSize: '0.7rem', color: 'var(--text-subtle)', height: '14px', position: 'relative' }}>
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${m.weekIndex * 14}px`,
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid Layout: Day Labels + Week Columns (7 rows x N weeks) */}
          <div style={{ display: 'flex' }}>
            {/* Day of Week Labels (Sun - Sat) */}
            <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 12px)', gap: '3px', marginRight: '6px', fontSize: '0.65rem', color: 'var(--text-subtle)', lineHeight: '12px' }}>
              {dayLabels.map((label, idx) => (
                <span key={idx} style={{ height: '12px', display: 'block' }}>{label}</span>
              ))}
            </div>

            {/* Weeks Columns */}
            <div style={{ display: 'flex', gap: '3px' }}>
              {weeks.map((week, wIdx) => (
                <div key={wIdx} style={{ display: 'grid', gridTemplateRows: 'repeat(7, 12px)', gap: '3px' }}>
                  {week.map((day, dIdx) => {
                    const formattedDate = day.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const tooltipText = day.isFuture
                      ? formattedDate
                      : `${formattedDate}: ${day.count} submission${day.count !== 1 ? 's' : ''}`;

                    return (
                      <div
                        key={dIdx}
                        title={tooltipText}
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '2px',
                          backgroundColor: getCellColor(day.count, day.isFuture),
                          border: (!day.isFuture && day.count === 0) ? '1px solid #27272a' : 'none',
                          cursor: day.isFuture ? 'default' : 'pointer',
                          transition: 'var(--transition)',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend & Stats Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
            <span><strong>{totalPastYearSubmissions}</strong> submissions in past 52 weeks</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Less</span>
              <span style={{ width: '10px', height: '10px', background: '#18181b', border: '1px solid #27272a', borderRadius: '2px' }} />
              <span style={{ width: '10px', height: '10px', background: 'rgba(34, 197, 94, 0.3)', borderRadius: '2px' }} />
              <span style={{ width: '10px', height: '10px', background: 'rgba(34, 197, 94, 0.55)', borderRadius: '2px' }} />
              <span style={{ width: '10px', height: '10px', background: 'rgba(34, 197, 94, 0.8)', borderRadius: '2px' }} />
              <span style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '2px' }} />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
