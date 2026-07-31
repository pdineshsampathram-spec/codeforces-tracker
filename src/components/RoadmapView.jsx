import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Map, Target, TrendingUp, Zap, Award, Calendar, BookOpen,
  ChevronDown, ChevronRight, CheckCircle2, Circle, RefreshCw,
  BarChart3, Clock, Flame, AlertTriangle, Star, ArrowRight,
  Trophy, Brain, Dumbbell, Lightbulb, Rocket, Shield, ExternalLink,
  Code2, Check, Filter
} from 'lucide-react';
import RateLimitModal from './RateLimitModal';

// ─── Helpers ───────────────────────────────────────────────

const CHECKLIST_KEY = 'cf_roadmap_checklist';

function loadChecklist() {
  try { return JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '{}'); } catch { return {}; }
}
function saveChecklist(obj) {
  localStorage.setItem(CHECKLIST_KEY, JSON.stringify(obj));
}

function getRankTier(rating) {
  if (!rating || rating < 1200) return { name: 'Newbie', color: '#a1a1aa', next: 1200 };
  if (rating < 1400) return { name: 'Pupil', color: '#22c55e', next: 1400 };
  if (rating < 1600) return { name: 'Specialist', color: '#06b6d4', next: 1600 };
  if (rating < 1900) return { name: 'Expert', color: '#3b82f6', next: 1900 };
  if (rating < 2100) return { name: 'Candidate Master', color: '#a855f7', next: 2100 };
  if (rating < 2300) return { name: 'Master', color: '#f97316', next: 2300 };
  if (rating < 2400) return { name: 'International Master', color: '#f97316', next: 2400 };
  if (rating < 2600) return { name: 'Grandmaster', color: '#ef4444', next: 2600 };
  if (rating < 3000) return { name: 'International Grandmaster', color: '#ef4444', next: 3000 };
  return { name: 'Legendary Grandmaster', color: '#ef4444', next: null };
}

function estimateWeeks(currentRating, targetRating, contestsPerMonth) {
  const delta = Math.max(0, targetRating - currentRating);
  if (delta === 0) return 1;
  const gainPerMonth = Math.max(15, Math.min(60, (contestsPerMonth || 1) * 20));
  const months = delta / gainPerMonth;
  return Math.max(2, Math.ceil(months * 4.3));
}

function getEstimatedSolveTime(rating) {
  if (!rating || rating <= 800) return '10–15 min';
  if (rating <= 1000) return '15–25 min';
  if (rating <= 1200) return '25–35 min';
  if (rating <= 1400) return '35–45 min';
  if (rating <= 1600) return '45–60 min';
  if (rating <= 1800) return '60–75 min';
  return '75–90 min';
}

function getDifficultyLabel(rating) {
  if (!rating || rating <= 800) return 'Beginner (Rating 800)';
  if (rating <= 1000) return 'Easy (Rating 900–1000)';
  if (rating <= 1200) return 'Easy-Medium (Rating 1100–1200)';
  if (rating <= 1400) return 'Medium (Rating 1300–1400)';
  if (rating <= 1600) return 'Medium-Hard (Rating 1500–1600)';
  if (rating <= 1800) return 'Hard (Rating 1700–1800)';
  return 'Advanced (Rating 1900+)';
}

function getLearningObjective(tags = [], rating = 800, subtopic = '') {
  const primaryTag = tags[0] || 'implementation';
  
  if (subtopic.includes('GCD') || subtopic.includes('LCM')) return 'Master Euclidean algorithm, GCD/LCM properties, and coprimality conditions.';
  if (subtopic.includes('Prime')) return 'Understand prime factorization, Sieve of Eratosthenes, and primality testing.';
  if (subtopic.includes('Modular')) return 'Apply modular arithmetic rules, modular inverse, and Fermat\'s Little Theorem.';
  if (subtopic.includes('Combinatorics')) return 'Master combinations, permutations, Pascal\'s triangle, and inclusion-exclusion.';
  if (subtopic.includes('BFS')) return 'Implement Breadth-First Search for shortest paths on unweighted graphs and grid grids.';
  if (subtopic.includes('DFS')) return 'Master Depth-First Search for path finding, cycle detection, and connected components.';
  if (subtopic.includes('Connected')) return 'Identify connected components, strongly connected components, and flood fill.';
  if (subtopic.includes('Shortest Path')) return 'Implement Dijkstra\'s, Bellman-Ford, or Floyd-Warshall for weighted shortest paths.';
  if (subtopic.includes('Trees')) return 'Master tree traversals, tree diameter, subtree queries, and ancestor tracking.';
  if (subtopic.includes('DSU')) return 'Implement Disjoint Set Union (Union-Find) with path compression and rank optimization.';
  if (subtopic.includes('MST')) return 'Apply Kruskal\'s or Prim\'s algorithms for Minimum Spanning Trees.';
  if (subtopic.includes('Topological')) return 'Implement Topological Sort using Kahn\'s algorithm or DFS post-order.';
  if (subtopic.includes('1D DP')) return 'Identify state transitions, recurrence relations, and base cases for linear DP.';
  if (subtopic.includes('2D DP')) return 'Build 2D table states for grid paths, string edit distance, and matrix DP.';
  if (subtopic.includes('Knapsack')) return 'Master 0/1 Knapsack, Unbounded Knapsack, and subset sum optimization.';
  if (subtopic.includes('LIS')) return 'Implement Longest Increasing Subsequence in O(N log N) using binary search.';
  if (subtopic.includes('Bitmask DP')) return 'Represent subset states as bitmasks for TSP-like state transitions.';
  if (subtopic.includes('Tree DP')) return 'Root trees and compute DP states bottom-up from leaves to root.';

  switch (primaryTag) {
    case 'math':
      return rating <= 1000 ? 'Basic mathematical formulation and ceiling division' : 'Number theory, modular arithmetic, and constructive math';
    case 'greedy':
      return 'Prove local optimal choice leads to global optimal solution';
    case 'implementation':
      return 'Accurate problem translation, array bounds checking, and handling edge cases';
    case 'dp':
      return 'Define optimal substructure and state transition equation';
    case 'data structures':
      return 'Choose appropriate data structures (maps, sets, segment trees) for optimal query speed';
    case 'binary search':
      return 'Formulate monotonic search space for binary search on answer';
    case 'graphs':
    case 'dfs and similar':
      return 'Graph modeling, state representation, and traversal optimization';
    case 'strings':
      return 'Pattern matching, string manipulation, and prefix/suffix properties';
    case 'two pointers':
      return 'Maintain sliding window or dual pointers to optimize time complexity from O(N^2) to O(N)';
    case 'constructive algorithms':
      return 'Construct valid solutions satisfying constraints through pattern discovery';
    default:
      return `Master core concepts in ${primaryTag} and improve problem-solving speed.`;
  }
}

function getReasonNext(subtopic = '', rating = 800) {
  if (subtopic) return `Essential ${subtopic} problem to build progression before tackling higher difficulty challenges.`;
  if (rating <= 900) return 'Foundational problem to build speed and accuracy before stepping up difficulty.';
  if (rating <= 1200) return 'Recommended next step to bridge basic implementation to intermediate algorithmic thinking.';
  if (rating <= 1500) return 'Core rating booster problem testing medium-level problem-solving and clean code execution.';
  return 'High-rating target problem to push your boundary toward expert level capability.';
}

// ─── Real Data Analysis Engine ─────────────────────────────

function analyzeProfile(submissions, ratingHistory, user) {
  const subs = Array.isArray(submissions) ? submissions : [];
  const ratings = Array.isArray(ratingHistory) ? ratingHistory : [];

  const okSubs = subs.filter(s => s.verdict === 'OK' || s.verdict === 'Accepted');
  const solvedSet = new Set();
  const solvedProblems = [];

  okSubs.forEach(s => {
    const cid = s.problem?.contestId || s.contestId || s.contest_id;
    const idx = s.problem?.index || s.index || s.problem_index;
    if (cid && idx) {
      const key = `${cid}-${idx}`;
      if (!solvedSet.has(key)) {
        solvedSet.add(key);
        solvedProblems.push(s);
      }
    }
  });

  const totalSubmissions = subs.length;
  const uniqueSolved = solvedSet.size;
  const acceptRate = totalSubmissions > 0 ? ((okSubs.length / totalSubmissions) * 100) : 0;

  const tagCounts = {};
  const tagRatings = {};

  solvedProblems.forEach(s => {
    const tags = s.problem?.tags || s.tags || s.problem_tags || [];
    const rating = s.problem?.rating || s.rating || s.problem_rating;
    tags.forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
      if (rating) {
        if (!tagRatings[t]) tagRatings[t] = [];
        tagRatings[t].push(rating);
      }
    });
  });

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const strongTags = sortedTags.slice(0, 5);
  const weakTags = sortedTags.length > 5 ? sortedTags.slice(-5).reverse() : [];

  const allCfTags = [
    'implementation', 'math', 'greedy', 'dp', 'data structures', 'brute force',
    'constructive algorithms', 'graphs', 'sortings', 'binary search', 'dfs and similar',
    'trees', 'strings', 'number theory', 'combinatorics', 'geometry', 'bitmasks',
    'two pointers', 'dsu', 'shortest paths', 'probabilities', 'divide and conquer'
  ];

  const untouchedTags = allCfTags.filter(t => !tagCounts[t] || tagCounts[t] < 2);

  const solvedRatings = solvedProblems.map(s => s.problem?.rating || s.rating || s.problem_rating).filter(r => r && typeof r === 'number');
  const maxSolvedRating = solvedRatings.length > 0 ? Math.max(...solvedRatings) : 800;
  const avgSolvedRating = solvedRatings.length > 0 ? Math.round(solvedRatings.reduce((a, b) => a + b, 0) / solvedRatings.length) : 800;

  const currentRating = user?.rating || (ratings.length > 0 ? ratings[ratings.length - 1]?.newRating : 0);
  const maxRating = user?.maxRating || (ratings.length > 0 ? Math.max(...ratings.map(r => r.newRating)) : 0);
  const contestCount = ratings.length;

  const ratingChanges = ratings.map(r => r.newRating - r.oldRating);
  const positiveContests = ratingChanges.filter(c => c > 0).length;
  const negativeContests = ratingChanges.filter(c => c < 0).length;
  const avgRatingChange = ratingChanges.length > 0 ? Math.round(ratingChanges.reduce((a, b) => a + b, 0) / ratingChanges.length) : 0;
  const contestWinRate = contestCount > 0 ? ((positiveContests / contestCount) * 100) : 0;

  const recentContests = ratings.slice(-5);
  const recentAvgRating = recentContests.length > 0
    ? Math.round(recentContests.reduce((a, b) => a + b.newRating, 0) / recentContests.length)
    : currentRating;
  const recentChanges = recentContests.map(r => r.newRating - r.oldRating);
  const recentTrend = recentChanges.length > 0 ? Math.round(recentChanges.reduce((a, b) => a + b, 0) / recentChanges.length) : 0;

  let contestsPerMonth = 0;
  if (ratings.length >= 2) {
    const firstContest = ratings[0].ratingUpdateTimeSeconds;
    const lastContest = ratings[ratings.length - 1].ratingUpdateTimeSeconds;
    const monthSpan = Math.max(1, (lastContest - firstContest) / (30 * 24 * 3600));
    contestsPerMonth = Math.round((contestCount / monthSpan) * 10) / 10;
  }

  const submissionDates = new Set();
  subs.forEach(s => {
    if (s.creationTimeSeconds) {
      const d = new Date(s.creationTimeSeconds * 1000);
      submissionDates.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  });

  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (submissionDates.has(key)) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }

  const now = Date.now();
  const last30dSolved = new Set();
  okSubs.forEach(s => {
    const cid = s.problem?.contestId || s.contestId || s.contest_id;
    const idx = s.problem?.index || s.index || s.problem_index;
    const key = `${cid}-${idx}`;
    const age = now - (s.creationTimeSeconds || 0) * 1000;
    if (age <= 30 * 86400000) last30dSolved.add(key);
  });

  const problemsPerWeek = last30dSolved.size > 0 ? Math.round((last30dSolved.size / 30) * 7 * 10) / 10 : 0;

  let biggestBottleneck = '';
  let bottleneckDetail = '';

  if (acceptRate < 40) {
    biggestBottleneck = 'Low Acceptance Rate';
    bottleneckDetail = `Your acceptance rate is ${acceptRate.toFixed(1)}%. Rushing submissions leads to WA/TLE. Focus on edge cases before submitting.`;
  } else if (contestCount < 5) {
    biggestBottleneck = 'Insufficient Contest Experience';
    bottleneckDetail = `Only ${contestCount} rated contests. Real rating growth requires consistent contest participation — aim for 2+ contests/month.`;
  } else if (contestWinRate < 35) {
    biggestBottleneck = 'Negative Contest Trend';
    bottleneckDetail = `Only ${positiveContests} of ${contestCount} contests gained rating (${contestWinRate.toFixed(0)}% win rate). Practice virtual contests to handle time pressure.`;
  } else if (currentStreak === 0 && problemsPerWeek < 3) {
    biggestBottleneck = 'Practice Inconsistency';
    bottleneckDetail = `No active streak and ~${problemsPerWeek} problems/week. Daily consistency is the #1 key to rating growth.`;
  } else {
    biggestBottleneck = 'Difficulty Plateau';
    bottleneckDetail = 'Maintain your consistency and push into higher rating problem tiers.';
  }

  return {
    handle: user?.handle || 'Active User',
    currentRating,
    maxRating,
    rank: user?.rank || 'Unrated',
    totalSubmissions,
    uniqueSolved,
    acceptRate: Math.round(acceptRate * 10) / 10,
    tagCounts,
    tagRatings,
    strongTags,
    weakTags,
    untouchedTags,
    sortedTags,
    maxSolvedRating,
    avgSolvedRating,
    solvedRatings,
    contestCount,
    positiveContests,
    negativeContests,
    avgRatingChange,
    contestWinRate: Math.round(contestWinRate * 10) / 10,
    contestsPerMonth,
    recentAvgRating,
    recentTrend,
    currentStreak,
    problemsPerWeek,
    solvedSet,
    biggestBottleneck,
    bottleneckDetail,
  };
}

// ─── Real Problem Allocation Engine ───────────────────────

function allocateRealProblems(problemset, solvedSet, analysis, targetRating) {
  if (!Array.isArray(problemset) || problemset.length === 0) {
    return null;
  }

  // Filter out solved problems
  const unsolved = problemset.filter(p => {
    if (!p.rating || !p.name || !p.contestId || !p.index) return false;
    const key1 = `${p.contestId}-${p.index}`;
    const key2 = `${p.contestId}${p.index}`;
    const key3 = p.id;
    return !solvedSet.has(key1) && !solvedSet.has(key2) && !solvedSet.has(key3);
  });

  if (unsolved.length === 0) return null;

  const usedIds = new Set();

  function pickProblems(filterFn, minRating, maxRating, count = 5) {
    const candidates = unsolved.filter(p => {
      if (usedIds.has(p.id)) return false;
      const inRating = p.rating >= minRating && p.rating <= maxRating;
      return inRating && filterFn(p);
    });

    // Sort by rating ascending (easiest to hardest)
    candidates.sort((a, b) => a.rating - b.rating);

    // Pick 'count' problems evenly spaced across rating
    const selected = [];
    if (candidates.length <= count) {
      candidates.forEach(p => {
        usedIds.add(p.id);
        selected.push(p);
      });
    } else {
      const step = (candidates.length - 1) / (count - 1);
      for (let i = 0; i < count; i++) {
        const idx = Math.min(candidates.length - 1, Math.round(i * step));
        const p = candidates[idx];
        if (p && !usedIds.has(p.id)) {
          usedIds.add(p.id);
          selected.push(p);
        }
      }
      // If still under count, fill remaining
      if (selected.length < count) {
        for (const p of candidates) {
          if (selected.length >= count) break;
          if (!usedIds.has(p.id)) {
            usedIds.add(p.id);
            selected.push(p);
          }
        }
      }
    }
    return selected;
  }

  // 1. Topic Progression Categorized Lists
  const topicsToBuild = [
    {
      category: 'Math',
      subtopics: [
        { name: 'Basic Arithmetic & Divisibility', filter: p => p.tags.includes('math') || p.tags.includes('implementation') },
        { name: 'GCD & LCM', filter: p => p.tags.includes('math') || p.tags.includes('number theory') },
        { name: 'Prime Numbers & Sieve', filter: p => p.tags.includes('number theory') || p.tags.includes('math') },
        { name: 'Modular Arithmetic', filter: p => p.tags.includes('math') || p.tags.includes('number theory') },
        { name: 'Combinatorics', filter: p => p.tags.includes('combinatorics') || p.tags.includes('math') },
      ]
    },
    {
      category: 'Graphs',
      subtopics: [
        { name: 'BFS & Grid Traversals', filter: p => p.tags.includes('graphs') || p.tags.includes('dfs and similar') || p.tags.includes('shortest paths') },
        { name: 'DFS & Path Finding', filter: p => p.tags.includes('dfs and similar') || p.tags.includes('graphs') },
        { name: 'Connected Components & Flood Fill', filter: p => p.tags.includes('dfs and similar') || p.tags.includes('graphs') || p.tags.includes('dsu') },
        { name: 'Shortest Path Algorithms', filter: p => p.tags.includes('shortest paths') || p.tags.includes('graphs') },
        { name: 'Trees & Subtree Queries', filter: p => p.tags.includes('trees') || p.tags.includes('dfs and similar') },
        { name: 'Disjoint Set Union (DSU)', filter: p => p.tags.includes('dsu') || p.tags.includes('graphs') },
        { name: 'Minimum Spanning Tree (MST)', filter: p => p.tags.includes('graphs') || p.tags.includes('trees') || p.tags.includes('dsu') },
        { name: 'Topological Sort', filter: p => p.tags.includes('graphs') || p.tags.includes('dfs and similar') },
      ]
    },
    {
      category: 'Dynamic Programming (DP)',
      subtopics: [
        { name: '1D DP & Linear Recurrences', filter: p => p.tags.includes('dp') },
        { name: '2D DP & Grid Paths', filter: p => p.tags.includes('dp') },
        { name: 'Knapsack & Subset Sum', filter: p => p.tags.includes('dp') },
        { name: 'LIS (Longest Increasing Subsequence)', filter: p => p.tags.includes('dp') || p.tags.includes('binary search') },
        { name: 'Bitmask DP', filter: p => p.tags.includes('dp') || p.tags.includes('bitmasks') },
        { name: 'Tree DP', filter: p => p.tags.includes('dp') || p.tags.includes('trees') },
      ]
    },
    {
      category: 'Greedy & Two Pointers',
      subtopics: [
        { name: 'Greedy Sorting & Intervals', filter: p => p.tags.includes('greedy') || p.tags.includes('sortings') },
        { name: 'Two Pointers & Sliding Window', filter: p => p.tags.includes('two pointers') || p.tags.includes('greedy') },
      ]
    },
    {
      category: 'Binary Search & Data Structures',
      subtopics: [
        { name: 'Binary Search on Answer', filter: p => p.tags.includes('binary search') },
        { name: 'Data Structures (Segment Trees, Fenwick, Maps)', filter: p => p.tags.includes('data structures') },
      ]
    }
  ];

  const minR = Math.max(800, (analysis.currentRating || 800) - 200);
  const maxR = Math.min(3500, targetRating + 200);

  const topicProgressionData = topicsToBuild.map(cat => {
    const subtopicList = cat.subtopics.map(sub => {
      const selected = pickProblems(sub.filter, minR, maxR, 5);
      const formatted = selected.map((p, idx) => ({
        name: p.name,
        contestId: p.contestId,
        index: p.index,
        problemCode: `${p.contestId}${p.index}`,
        rating: p.rating,
        tags: p.tags,
        estimatedTime: getEstimatedSolveTime(p.rating),
        difficultyLevel: getDifficultyLabel(p.rating),
        objective: getLearningObjective(p.tags, p.rating, sub.name),
        reason: getReasonNext(sub.name, p.rating),
        url: p.url || `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
      }));

      return {
        name: sub.name,
        problems: formatted,
      };
    });

    return {
      category: cat.category,
      subtopics: subtopicList.filter(s => s.problems.length > 0),
    };
  }).filter(c => c.subtopics.length > 0);

  // 2. Generate Weekly Plan with Real Problems
  const totalWeeks = estimateWeeks(analysis.currentRating || 800, targetRating, analysis.contestsPerMonth || 1);
  const startDiff = Math.max(800, (analysis.currentRating || 800) - 100);
  const endDiff = Math.min(3500, targetRating + 100);
  const diffStep = Math.max(50, Math.round((endDiff - startDiff) / Math.max(1, totalWeeks)));

  const weeklyPlanData = [];

  for (let w = 0; w < totalWeeks; w++) {
    const wMin = Math.min(endDiff, startDiff + diffStep * w);
    const wMax = Math.min(endDiff, wMin + diffStep + 100);
    const phase = w < totalWeeks * 0.3 ? 'foundation' : w < totalWeeks * 0.7 ? 'growth' : 'peak';

    // Select 3 real unsolved problems for "Today's Problems" for this week
    const weekProblems = pickProblems(() => true, wMin, wMax, 3);
    const formattedWeekProblems = weekProblems.map((p, idx) => ({
      name: p.name,
      contestId: p.contestId,
      index: p.index,
      problemCode: `${p.contestId}${p.index}`,
      rating: p.rating,
      tags: p.tags,
      estimatedTime: getEstimatedSolveTime(p.rating),
      difficultyLevel: getDifficultyLabel(p.rating),
      reason: idx === 0 ? 'Warm-up problem to build speed' : idx === 1 ? 'Target rating problem matching week difficulty' : 'Challenge problem to expand technique',
      url: p.url || `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
    }));

    const focusTags = [...new Set(weekProblems.flatMap(p => p.tags))].slice(0, 3);

    weeklyPlanData.push({
      week: w + 1,
      phase,
      ratingRange: `${wMin}–${wMax}`,
      ratingMin: wMin,
      ratingMax: wMax,
      topics: focusTags.length > 0 ? focusTags : ['implementation', 'math'],
      todaysProblems: formattedWeekProblems,
      contest: w % 2 === 0 ? 'Participate in 1 rated contest' : 'Do 1 virtual contest from a past Div. 2/3 round',
      milestone: w === 0 ? 'Build momentum — solve all 3 assigned problems' :
        w === Math.floor(totalWeeks * 0.5) ? `Halfway mark — target difficulty (${wMin}) achieved` :
        w === totalWeeks - 1 ? `Goal week — reach ${targetRating} rating!` : `Solve assigned ${wMin}-rated problems consistently`,
    });
  }

  return {
    topicProgressionData,
    weeklyPlanData,
  };
}

// ─── Main Component ────────────────────────────────────────

export default function RoadmapView({ submissions = [], user = null, ratingHistory = [] }) {
  const [targetRating, setTargetRating] = useState('');
  const [generatedTarget, setGeneratedTarget] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState({ 0: true });
  const [checklist, setChecklist] = useState(loadChecklist());
  const [aiNarrative, setAiNarrative] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [rateLimitData, setRateLimitData] = useState(null);
  const [isRateLimitOpen, setIsRateLimitOpen] = useState(false);

  // Live Problemset State
  const [problemset, setProblemset] = useState([]);
  const [loadingProblemset, setLoadingProblemset] = useState(true);
  const [problemsetError, setProblemsetError] = useState(null);

  // Compute profile analysis
  const analysis = useMemo(() => analyzeProfile(submissions, ratingHistory, user), [submissions, ratingHistory, user]);

  // Fetch Live Problemset on Mount
  useEffect(() => {
    let isMounted = true;
    setLoadingProblemset(true);
    setProblemsetError(null);

    fetch('/api/problemset')
      .then(res => {
        if (!res.ok) throw new Error('API return non-200');
        return res.json();
      })
      .then(json => {
        if (isMounted) {
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setProblemset(json.data);
            setLoadingProblemset(false);
          } else {
            // Direct Fallback to Codeforces API
            fetch('https://codeforces.com/api/problemset.problems')
              .then(r => r.json())
              .then(cfJson => {
                if (cfJson.status === 'OK' && cfJson.result?.problems) {
                  const live = cfJson.result.problems
                    .filter(p => p.rating && p.name && p.contestId && p.index)
                    .map(p => ({
                      id: `${p.contestId}${p.index}`,
                      contestId: p.contestId,
                      index: p.index,
                      name: p.name,
                      rating: p.rating,
                      tags: p.tags || [],
                      url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
                    }));
                  setProblemset(live);
                } else {
                  throw new Error('Problemset empty');
                }
              })
              .catch(() => {
                setProblemsetError('Unable to retrieve official Codeforces problems. Please synchronize the problemset API before generating the roadmap.');
              })
              .finally(() => setLoadingProblemset(false));
          }
        }
      })
      .catch(() => {
        fetch('https://codeforces.com/api/problemset.problems')
          .then(r => r.json())
          .then(cfJson => {
            if (isMounted && cfJson.status === 'OK' && cfJson.result?.problems) {
              const live = cfJson.result.problems
                .filter(p => p.rating && p.name && p.contestId && p.index)
                .map(p => ({
                  id: `${p.contestId}${p.index}`,
                  contestId: p.contestId,
                  index: p.index,
                  name: p.name,
                  rating: p.rating,
                  tags: p.tags || [],
                  url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
                }));
              setProblemset(live);
              setLoadingProblemset(false);
            } else {
              setProblemsetError('Unable to retrieve official Codeforces problems. Please synchronize the problemset API before generating the roadmap.');
              setLoadingProblemset(false);
            }
          })
          .catch(() => {
            if (isMounted) {
              setProblemsetError('Unable to retrieve official Codeforces problems. Please synchronize the problemset API before generating the roadmap.');
              setLoadingProblemset(false);
            }
          });
      });

    return () => { isMounted = false; };
  }, []);

  const autoTarget = useMemo(() => {
    const tier = getRankTier(analysis.currentRating);
    return tier.next || (analysis.currentRating + 200);
  }, [analysis.currentRating]);

  const effectiveTarget = generatedTarget || autoTarget;

  // Allocate Real Problems into Weekly Plan & Topic Progression
  const realAllocations = useMemo(() => {
    if (problemset.length === 0) return null;
    return allocateRealProblems(problemset, analysis.solvedSet, analysis, effectiveTarget);
  }, [problemset, analysis, effectiveTarget]);

  const weeklyPlan = realAllocations?.weeklyPlanData || [];
  const topicProgression = realAllocations?.topicProgressionData || [];

  const currentTier = getRankTier(analysis.currentRating);
  const targetTier = getRankTier(effectiveTarget);
  const estWeeks = estimateWeeks(analysis.currentRating, effectiveTarget, analysis.contestsPerMonth || 1);

  const fetchAiNarrative = async (target) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: analysis.handle,
          submissions,
          ratingHistory,
          user,
          targetRating: target,
        }),
      });
      const json = await res.json();
      if (json.rateLimited || res.status === 429) {
        setRateLimitData(json);
        setIsRateLimitOpen(true);
        return;
      }
      if (json.success && json.data) {
        setAiNarrative(json.data);
      }
    } catch (err) {
      console.error('Roadmap AI Error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerate = useCallback(() => {
    const parsed = parseInt(targetRating);
    if (parsed && parsed > (analysis.currentRating || 0)) {
      setGeneratedTarget(parsed);
    } else {
      setGeneratedTarget(autoTarget);
    }
    setExpandedWeeks({ 0: true });
    fetchAiNarrative(parsed || autoTarget);
  }, [targetRating, analysis.currentRating, autoTarget]);

  const toggleWeek = (idx) => {
    setExpandedWeeks(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleChecklistItem = (id) => {
    setChecklist(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      saveChecklist(updated);
      return updated;
    });
  };

  useEffect(() => {
    if (analysis.handle && analysis.totalSubmissions > 0) {
      fetchAiNarrative(autoTarget);
    }
  }, [analysis.handle]);

  // Practice ratio
  const practiceRatio = useMemo(() => {
    const total = analysis.totalSubmissions || 1;
    const contestSubs = submissions.filter(s => s.author?.participantType === 'CONTESTANT' || s.author?.participantType === 'VIRTUAL').length;
    const practiceSubs = total - contestSubs;
    return {
      practice: Math.round((practiceSubs / total) * 100),
      contest: Math.round((contestSubs / total) * 100),
      revision: Math.max(0, 100 - Math.round((practiceSubs / total) * 100) - Math.round((contestSubs / total) * 100)),
    };
  }, [submissions, analysis.totalSubmissions]);

  // Checklist items
  const checklistItems = useMemo(() => [
    { id: 'target_rating', text: `Reach ${effectiveTarget} rating in a rated contest`, done: (analysis.currentRating || 0) >= effectiveTarget },
    { id: 'solve_50', text: `Solve ${Math.max(15, Math.ceil((effectiveTarget - (analysis.currentRating || 800)) / 10))} real unsolved problems at target difficulty`, done: false },
    { id: 'contests', text: `Participate in ${Math.max(4, Math.ceil(estWeeks / 2))} rated contests`, done: false },
    { id: 'streak', text: `Maintain a ${Math.max(7, analysis.currentStreak + 3)}-day solving streak`, done: analysis.currentStreak >= 7 },
    { id: 'upsolve', text: 'Upsolve at least 1 problem from every contest', done: false },
  ], [effectiveTarget, analysis.currentRating, analysis.currentStreak, estWeeks]);

  const completedChecks = checklistItems.filter(item => checklist[item.id]).length;
  const checklistProgress = Math.round((completedChecks / checklistItems.length) * 100);

  return (
    <div>
      {/* ═══ Header ═══ */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Map size={22} style={{ color: 'var(--accent-blue)' }} />
          Personalized CP Roadmap (Real Codeforces Problems)
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Data-driven training plan built from your {analysis.totalSubmissions.toLocaleString()} submissions and official Codeforces problems.
        </p>
      </div>

      {/* ═══ Error State if Problemset API Fails ═══ */}
      {problemsetError && (
        <div className="ent-card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent-red)' }}>
            <AlertTriangle size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{problemsetError}</span>
          </div>
        </div>
      )}

      {/* ═══ Target Rating Selector ═══ */}
      <div className="ent-card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
              Target Rating
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                className="cmd-input"
                placeholder={`e.g. ${autoTarget}`}
                value={targetRating}
                onChange={(e) => setTargetRating(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.55rem 0.85rem',
                  fontSize: '0.9rem',
                  width: '160px',
                  fontFamily: 'var(--font-mono)',
                }}
              />
              <button className="btn-primary-sm" onClick={handleGenerate} disabled={aiLoading || loadingProblemset}>
                {aiLoading || loadingProblemset ? <RefreshCw size={14} className="spinner" /> : <Rocket size={14} />}
                <span>{generatedTarget ? 'Regenerate' : 'Generate'} Roadmap</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>Current</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: currentTier.color }}>{analysis.currentRating || 'Unrated'}</div>
              <div style={{ fontSize: '0.7rem', color: currentTier.color }}>{currentTier.name}</div>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--text-subtle)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>Target</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: targetTier.color }}>{effectiveTarget}</div>
              <div style={{ fontSize: '0.7rem', color: targetTier.color }}>{targetTier.name}</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', height: '40px', margin: '0 0.5rem' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>Est. Duration</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{estWeeks}w</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>~{Math.ceil(estWeeks / 4.3)} months</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Section 1: Current Assessment ═══ */}
      <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <BarChart3 size={18} style={{ color: 'var(--accent-blue)' }} />
            Current Skill & Telemetry Assessment
          </h3>
          <span className="status-badge" style={{ background: currentTier.color + '20', color: currentTier.color, borderColor: currentTier.color + '40' }}>
            {currentTier.name}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>Rating</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: currentTier.color, fontFamily: 'var(--font-mono)' }}>{analysis.currentRating || 'Unrated'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Peak: <strong style={{ color: 'var(--text-main)' }}>{analysis.maxRating}</strong> · Estimated skill: <strong style={{ color: 'var(--text-main)' }}>{analysis.recentAvgRating}</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>Solve Stats</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>{analysis.uniqueSolved}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              unique solved · {analysis.acceptRate}% AC rate · avg difficulty <strong style={{ color: 'var(--text-main)' }}>{analysis.avgSolvedRating}</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>Contests</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>{analysis.contestCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {analysis.positiveContests}↑ {analysis.negativeContests}↓ · {analysis.contestWinRate}% win · avg Δ{analysis.avgRatingChange > 0 ? '+' : ''}{analysis.avgRatingChange}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>Consistency</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: analysis.currentStreak > 0 ? 'var(--accent-orange)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {analysis.currentStreak}d
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>streak</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {analysis.problemsPerWeek} problems/week · {problemset.length > 0 ? `${problemset.length.toLocaleString()} Codeforces problems loaded` : 'Loading problemset...'}
            </div>
          </div>
        </div>

        {/* Bottleneck */}
        <div style={{ marginTop: '1rem', background: 'rgba(249, 115, 22, 0.06)', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={18} style={{ color: 'var(--accent-orange)', flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-orange)', marginBottom: '0.2rem' }}>Biggest Bottleneck: {analysis.biggestBottleneck}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>{analysis.bottleneckDetail}</div>
          </div>
        </div>
      </div>

      {/* ═══ Section 2: Weekly Roadmap with TODAY'S REAL PROBLEMS ═══ */}
      <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <Calendar size={18} style={{ color: 'var(--accent-blue)' }} />
            Weekly Roadmap & Real Codeforces Problems ({weeklyPlan.length} weeks)
          </h3>
          <span className="status-badge" style={{ background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            {analysis.currentRating || 800} → {effectiveTarget}
          </span>
        </div>

        {/* Progress stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '1.25rem', padding: '0 0.5rem', overflowX: 'auto' }}>
          {weeklyPlan.map((w, i) => {
            const isActive = i === 0;
            const phaseColor = w.phase === 'foundation' ? 'var(--accent-green)' : w.phase === 'growth' ? 'var(--accent-blue)' : 'var(--accent-purple)';
            return (
              <React.Fragment key={i}>
                <div
                  onClick={() => toggleWeek(i)}
                  style={{
                    minWidth: '28px', height: '28px', borderRadius: '50%',
                    background: isActive ? phaseColor : 'rgba(255,255,255,0.06)',
                    border: `2px solid ${phaseColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, color: isActive ? '#000' : phaseColor,
                    cursor: 'pointer', flexShrink: 0, transition: 'var(--transition)',
                  }}
                  title={`Week ${w.week}: ${w.ratingRange}`}
                >
                  {w.week}
                </div>
                {i < weeklyPlan.length - 1 && (
                  <div style={{ flex: 1, height: '2px', background: phaseColor, opacity: 0.3, minWidth: '8px' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Week cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {weeklyPlan.map((w, i) => {
            const isExpanded = expandedWeeks[i];
            const phaseColor = w.phase === 'foundation' ? 'var(--accent-green)' : w.phase === 'growth' ? 'var(--accent-blue)' : 'var(--accent-purple)';
            const phaseLabel = w.phase === 'foundation' ? '🌱 Foundation' : w.phase === 'growth' ? '📈 Growth' : '🏆 Peak Performance';

            return (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <button
                  onClick={() => toggleWeek(i)}
                  style={{
                    width: '100%', background: 'none', border: 'none', padding: '0.85rem 1rem',
                    display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
                    color: 'var(--text-main)', textAlign: 'left',
                  }}
                >
                  {isExpanded ? <ChevronDown size={16} style={{ color: phaseColor }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                  <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Week {w.week}</span>
                  <span style={{ fontSize: '0.725rem', color: phaseColor, fontWeight: 600 }}>{phaseLabel}</span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
                    ★ Rating {w.ratingRange}
                  </span>
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border-subtle)' }}>
                    {/* Assigned Real Codeforces Problems for this Week */}
                    <div style={{ marginTop: '0.85rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Code2 size={14} /> Assigned Real Codeforces Problems (Week {w.week})
                      </div>

                      {w.todaysProblems.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                          {w.todaysProblems.map((prob, pidx) => (
                            <div key={pidx} style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                <div>
                                  <span style={{ fontSize: '0.675rem', color: 'var(--accent-blue)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{prob.problemCode}</span>
                                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.1rem 0' }}>{prob.name}</h4>
                                </div>
                                <span className="status-badge" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent-blue)', fontSize: '0.7rem' }}>
                                  ★ {prob.rating}
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.4rem' }}>
                                {prob.tags.map((t, ti) => (
                                  <span key={ti} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', padding: '0.1rem 0.35rem', color: 'var(--text-muted)' }}>{t}</span>
                                ))}
                              </div>

                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
                                <div>⏱️ Est. Time: <strong style={{ color: 'var(--text-main)' }}>{prob.estimatedTime}</strong></div>
                                <div>💡 Objective: {prob.reason}</div>
                              </div>

                              <a
                                href={prob.url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-secondary-sm"
                                style={{ fontSize: '0.725rem', padding: '0.3rem 0.6rem', width: '100%', justifyContent: 'center' }}
                              >
                                <span>Solve on Codeforces ({prob.problemCode})</span>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading real problems...</div>
                      )}
                    </div>

                    {/* Milestone */}
                    {w.milestone && (
                      <div style={{ marginTop: '0.85rem', padding: '0.6rem 0.85rem', background: phaseColor + '12', border: `1px solid ${phaseColor}30`, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trophy size={14} style={{ color: phaseColor }} />
                        <span style={{ fontSize: '0.8rem', color: phaseColor, fontWeight: 600 }}>Milestone: {w.milestone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ Section 3: Topic Progression with REAL CODEFORCES PROBLEMS ═══ */}
      <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <BookOpen size={18} style={{ color: 'var(--accent-green)' }} />
            Topic Progression & Recommended Real Codeforces Problems
          </h3>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
            Real Codeforces problemset filtered for unsolved problems
          </span>
        </div>

        {topicProgression.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {topicProgression.map((cat, ci) => (
              <div key={ci} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Star size={16} /> {cat.category}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {cat.subtopics.map((sub, si) => (
                    <div key={si} style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>📌 {sub.name}</span>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{sub.problems.length} real problems</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                        {sub.problems.map((p, pi) => (
                          <div key={pi} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                              <div>
                                <span style={{ fontSize: '0.675rem', color: 'var(--accent-blue)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                  Contest {p.contestId} · Problem {p.index} ({p.problemCode})
                                </span>
                                <h5 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.1rem 0' }}>{p.name}</h5>
                              </div>
                              <span className="status-badge" style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'var(--accent-green)', fontSize: '0.7rem' }}>
                                ★ {p.rating}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                              {p.tags.map((t, ti) => (
                                <span key={ti} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', padding: '0.1rem 0.35rem', color: 'var(--text-muted)' }}>{t}</span>
                              ))}
                            </div>

                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '0.6rem' }}>
                              <div>📊 <strong>Difficulty:</strong> {p.difficultyLevel}</div>
                              <div>⏱️ <strong>Est. Solve Time:</strong> {p.estimatedTime}</div>
                              <div>🎯 <strong>Learning Objective:</strong> {p.objective}</div>
                              <div>🚀 <strong>Why Next:</strong> {p.reason}</div>
                            </div>

                            <a
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-secondary-sm"
                              style={{ fontSize: '0.725rem', padding: '0.35rem 0.65rem', width: '100%', justifyContent: 'center' }}
                            >
                              <span>Official Codeforces Problem ({p.problemCode})</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {loadingProblemset ? (
              <div>
                <div className="spinner" style={{ margin: '0 auto 0.75rem', width: '24px', height: '24px', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }} />
                Fetching official Codeforces problemset...
              </div>
            ) : (
              <div>Unable to retrieve official Codeforces problems. Please synchronize the problemset API before generating the roadmap.</div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Section 4: AI Coaching Narrative & Motivation ═══ */}
      {aiNarrative?.motivation && (
        <div className="ent-card" style={{ marginBottom: '1.5rem', borderLeft: '3px solid var(--accent-green)' }}>
          <div className="ent-card-header">
            <h3 className="ent-card-title">
              <Flame size={18} style={{ color: 'var(--accent-orange)' }} />
              Mentor's Dedicated Feedback & Encouragement
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
            {aiNarrative.motivation}
          </p>
        </div>
      )}

      {/* ═══ Section 5: Progress Checklist ═══ */}
      <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <Target size={18} style={{ color: 'var(--accent-green)' }} />
            Progress Checklist
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
              {completedChecks}/{checklistItems.length}
            </span>
            <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${checklistProgress}%`, height: '100%', background: 'var(--accent-green)', borderRadius: '3px', transition: 'var(--transition)' }} />
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{checklistProgress}%</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {checklistItems.map((item) => {
            const isChecked = checklist[item.id];
            return (
              <button
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.65rem 0.85rem', background: isChecked ? 'rgba(34, 197, 94, 0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isChecked ? 'rgba(34, 197, 94, 0.2)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', width: '100%', textAlign: 'left',
                  transition: 'var(--transition)',
                }}
              >
                {isChecked
                  ? <CheckCircle2 size={16} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                  : <Circle size={16} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                }
                <span style={{
                  fontSize: '0.85rem',
                  color: isChecked ? 'var(--text-subtle)' : 'var(--text-main)',
                  textDecoration: isChecked ? 'line-through' : 'none',
                }}>
                  {item.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rate Limit Modal */}
      <RateLimitModal
        isOpen={isRateLimitOpen}
        onClose={() => setIsRateLimitOpen(false)}
        rateLimitData={rateLimitData}
      />
    </div>
  );
}
