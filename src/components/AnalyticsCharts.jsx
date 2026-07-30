import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { PieChart, BarChart3, TrendingUp, Tags, Calendar } from 'lucide-react';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsCharts({ submissions, ratingHistory }) {
  const [timeRange, setTimeRange] = useState('30D');

  // Filter submissions by time range
  const nowMs = Date.now();
  const timeLimitsMs = {
    '7D': 7 * 24 * 60 * 60 * 1000,
    '30D': 30 * 24 * 60 * 60 * 1000,
    '90D': 90 * 24 * 60 * 60 * 1000,
    'ALL': Infinity
  };

  const limit = timeLimitsMs[timeRange] || timeLimitsMs['30D'];
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => (nowMs - s.creationTimeSeconds * 1000) <= limit);
  }, [submissions, limit]);

  // 1. Verdict breakdown
  const verdictCounts = useMemo(() => {
    const counts = {};
    filteredSubmissions.forEach(sub => {
      const v = sub.verdict || 'OTHER';
      counts[v] = (counts[v] || 0) + 1;
    });
    return counts;
  }, [filteredSubmissions]);

  const verdictLabelsMap = {
    'OK': 'Accepted (OK)',
    'WRONG_ANSWER': 'Wrong Answer',
    'TIME_LIMIT_EXCEEDED': 'Time Limit Exceeded',
    'COMPILATION_ERROR': 'Compile Error',
    'RUNTIME_ERROR': 'Runtime Error',
    'MEMORY_LIMIT_EXCEEDED': 'Memory Limit Exceeded',
  };

  const verdictColorsMap = {
    'OK': '#22c55e',
    'WRONG_ANSWER': '#ef4444',
    'TIME_LIMIT_EXCEEDED': '#f97316',
    'COMPILATION_ERROR': '#71717a',
    'RUNTIME_ERROR': '#a855f7',
    'MEMORY_LIMIT_EXCEEDED': '#3b82f6',
  };

  const verdictLabels = Object.keys(verdictCounts).map(k => verdictLabelsMap[k] || k);
  const verdictData = Object.values(verdictCounts);
  const verdictColors = Object.keys(verdictCounts).map(k => verdictColorsMap[k] || '#3b82f6');

  const verdictChartData = {
    labels: verdictLabels,
    datasets: [{
      data: verdictData,
      backgroundColor: verdictColors,
      borderColor: '#18181b',
      borderWidth: 2
    }]
  };

  // 2. Rating breakdown & Top Tags
  const { sortedRatings, ratingCounts, sortedTags } = useMemo(() => {
    const rCounts = {};
    const tCounts = {};
    const solvedProblemsMap = new Map();

    filteredSubmissions.forEach(sub => {
      if (sub.verdict === 'OK') {
        const key = `${sub.problem?.contestId}-${sub.problem?.index}`;
        if (!solvedProblemsMap.has(key)) {
          solvedProblemsMap.set(key, sub.problem);
          if (sub.problem?.rating) {
            rCounts[sub.problem.rating] = (rCounts[sub.problem.rating] || 0) + 1;
          }
          if (sub.problem?.tags) {
            sub.problem.tags.forEach(tag => {
              tCounts[tag] = (tCounts[tag] || 0) + 1;
            });
          }
        }
      }
    });

    const sRatings = Object.keys(rCounts).map(Number).sort((a, b) => a - b);
    const sTags = Object.entries(tCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return { sortedRatings: sRatings, ratingCounts: rCounts, sortedTags: sTags };
  }, [filteredSubmissions]);

  const ratingChartData = {
    labels: sortedRatings.map(r => r.toString()),
    datasets: [{
      label: 'Problems Solved',
      data: sortedRatings.map(r => ratingCounts[r]),
      backgroundColor: 'rgba(59, 130, 246, 0.75)',
      borderColor: '#3b82f6',
      borderWidth: 1,
      borderRadius: 4
    }]
  };

  const tagsChartData = {
    labels: sortedTags.map(t => t[0]),
    datasets: [{
      label: 'Solved Problems',
      data: sortedTags.map(t => t[1]),
      backgroundColor: 'rgba(168, 85, 247, 0.75)',
      borderColor: '#a855f7',
      borderWidth: 1,
      borderRadius: 4
    }]
  };

  // 3. CONTINUOUS Submission Activity Volume Timeline (No Gaps, No Hardcoded Fallbacks)
  const { activityLabels, activityData } = useMemo(() => {
    // Map dates (YYYY-MM-DD) to submission counts
    const countsMap = new Map();
    submissions.forEach(sub => {
      if (!sub.creationTimeSeconds) return;
      const d = new Date(sub.creationTimeSeconds * 1000);
      const dStr = d.toISOString().split('T')[0];
      countsMap.set(dStr, (countsMap.get(dStr) || 0) + 1);
    });

    const numDays = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : timeRange === '90D' ? 90 : 180;
    const labels = [];
    const data = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const displayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      labels.push(displayLabel);
      data.push(countsMap.get(dStr) || 0);
    }

    return { activityLabels: labels, activityData: data };
  }, [submissions, timeRange]);

  const activityChartData = {
    labels: activityLabels,
    datasets: [{
      label: 'Submissions Volume',
      data: activityData,
      borderColor: '#3b82f6',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
        return gradient;
      },
      fill: true,
      tension: 0.3,
      pointRadius: activityLabels.length > 60 ? 0 : 2,
      pointHoverRadius: 5
    }]
  };

  const chartOptionsClean = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#a1a1aa', font: { family: 'Inter' } }
      },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#f4f4f5',
        bodyColor: '#a1a1aa',
        borderColor: '#27272a',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: '#71717a', maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
        grid: { color: 'rgba(255, 255, 255, 0.03)' }
      },
      y: {
        ticks: { color: '#71717a', precision: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        beginAtZero: true
      }
    }
  };

  return (
    <div>
      {/* Main Activity Area Chart */}
      <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
        <div className="ent-card-header">
          <div>
            <h3 className="ent-card-title">Submission Activity Volume</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              Continuous submission volume over time ({timeRange === 'ALL' ? 'Last 180 Days' : `Last ${timeRange}`})
            </span>
          </div>

          {/* Time Range Selector Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-app)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            {['7D', '30D', '90D', 'ALL'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  background: timeRange === range ? 'var(--bg-card)' : 'transparent',
                  border: timeRange === range ? '1px solid var(--border-subtle)' : 'none',
                  color: timeRange === range ? 'var(--text-main)' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.65rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                {range === 'ALL' ? 'All Time' : `Last ${range}`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', height: '260px' }}>
          <Line data={activityChartData} options={chartOptionsClean} />
        </div>
      </div>

      {/* Grid of Secondary Breakdown Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="ent-card">
          <div className="ent-card-header">
            <h3 className="ent-card-title">
              <PieChart size={16} style={{ color: 'var(--accent-green)' }} />
              Verdict Breakdown
            </h3>
          </div>
          <div style={{ height: '220px' }}>
            <Doughnut data={verdictChartData} options={{ ...chartOptionsClean, plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa' } } } }} />
          </div>
        </div>

        <div className="ent-card">
          <div className="ent-card-header">
            <h3 className="ent-card-title">
              <BarChart3 size={16} style={{ color: 'var(--accent-blue)' }} />
              Difficulty Distribution
            </h3>
          </div>
          <div style={{ height: '220px' }}>
            <Bar data={ratingChartData} options={chartOptionsClean} />
          </div>
        </div>

        <div className="ent-card">
          <div className="ent-card-header">
            <h3 className="ent-card-title">
              <Tags size={16} style={{ color: 'var(--accent-purple)' }} />
              Top Solved Tags
            </h3>
          </div>
          <div style={{ height: '220px' }}>
            <Bar data={tagsChartData} options={{ ...chartOptionsClean, indexAxis: 'y' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
