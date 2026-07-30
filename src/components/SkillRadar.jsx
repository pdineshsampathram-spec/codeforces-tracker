import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Hexagon } from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

export default function SkillRadar({ submissions }) {
  const { labels, values, maxVal } = useMemo(() => {
    const tagCounts = {};
    const okSubs = submissions.filter(s => s.verdict === 'OK');
    const seen = new Set();

    okSubs.forEach(sub => {
      const key = `${sub.problem?.contestId}-${sub.problem?.index}`;
      if (seen.has(key)) return;
      seen.add(key);

      if (sub.problem?.tags) {
        sub.problem.tags.forEach(t => {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      labels: sorted.map(([tag]) => tag),
      values: sorted.map(([, count]) => count),
      maxVal: sorted.length > 0 ? Math.max(...sorted.map(([, c]) => c)) : 10,
    };
  }, [submissions]);

  if (labels.length < 3) return null;

  const data = {
    labels,
    datasets: [
      {
        label: 'Problems Solved',
        data: values,
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        borderColor: 'rgba(59, 130, 246, 0.6)',
        borderWidth: 1.5,
        pointBackgroundColor: 'rgba(59, 130, 246, 0.8)',
        pointBorderColor: 'rgba(59, 130, 246, 1)',
        pointBorderWidth: 1,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#f4f4f5',
        bodyColor: '#a1a1aa',
        borderColor: '#27272a',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (ctx) => `${ctx.parsed.r} problems solved`,
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: Math.ceil(maxVal * 1.2),
        ticks: {
          display: false,
          stepSize: Math.max(1, Math.ceil(maxVal / 4)),
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
          lineWidth: 1,
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.06)',
          lineWidth: 1,
        },
        pointLabels: {
          color: '#a1a1aa',
          font: {
            family: "'Inter', sans-serif",
            size: 11,
            weight: 500,
          },
          padding: 12,
        },
      },
    },
  };

  return (
    <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
      <div className="ent-card-header">
        <h3 className="ent-card-title">
          <Hexagon size={16} style={{ color: 'var(--accent-blue)' }} />
          Skill Proficiency Radar
        </h3>
        <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
          Top {labels.length} tags by problems solved
        </span>
      </div>
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '0.5rem 0' }}>
        <Radar data={data} options={options} />
      </div>
    </div>
  );
}
