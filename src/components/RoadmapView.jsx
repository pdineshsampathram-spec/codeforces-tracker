import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Map, Target, TrendingUp, Zap, Award, Calendar, BookOpen,
  ChevronDown, ChevronRight, CheckCircle2, Circle, RefreshCw,
  BarChart3, Clock, Flame, AlertTriangle, Star, ArrowRight,
  Trophy, Brain, Dumbbell, Lightbulb, Rocket, Shield
} from 'lucide-react';
import RateLimitModal from './RateLimitModal';

// ─── Helpers ───────────────────────────────────────────────

const CHECKLIST_KEY = 'cf_roadmap_checklist';
const ROADMAP_CACHE_KEY = 'cf_roadmap_cache';

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
  // Estimate ~30-50 rating gain per active month with regular contests
  const gainPerMonth = Math.max(15, Math.min(60, contestsPerMonth * 20));
  const months = delta / gainPerMonth;
  return Math.max(2, Math.ceil(months * 4.3));
}

// ─── Real Data Analysis Engine ─────────────────────────────

function analyzeProfile(submissions, ratingHistory, user) {
  const subs = Array.isArray(submissions) ? submissions : [];
  const ratings = Array.isArray(ratingHistory) ? ratingHistory : [];

  // === Basic Counts ===
  const okSubs = subs.filter(s => s.verdict === 'OK');
  const solvedSet = new Set();
  const solvedProblems = [];

  okSubs.forEach(s => {
    const cid = s.problem?.contestId || s.contestId;
    const idx = s.problem?.index || s.index;
    const key = `${cid}-${idx}`;
    if (!solvedSet.has(key)) {
      solvedSet.add(key);
      solvedProblems.push(s);
    }
  });

  const totalSubmissions = subs.length;
  const uniqueSolved = solvedSet.size;
  const acceptRate = totalSubmissions > 0 ? ((okSubs.length / totalSubmissions) * 100) : 0;

  // === Tag Analysis ===
  const tagCounts = {};
  const tagRatings = {}; // tag -> [ratings] for average difficulty per tag

  solvedProblems.forEach(s => {
    const tags = s.problem?.tags || [];
    const rating = s.problem?.rating;
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

  // All standard CF tags that user hasn't solved much
  const allCfTags = [
    'implementation', 'math', 'greedy', 'dp', 'data structures', 'brute force',
    'constructive algorithms', 'graphs', 'sortings', 'binary search', 'dfs and similar',
    'trees', 'strings', 'number theory', 'combinatorics', 'geometry', 'bitmasks',
    'two pointers', 'dsu', 'shortest paths', 'probabilities', 'divide and conquer',
    'hashing', 'games', 'flows', 'interactive', 'matrices', 'string suffix structures',
    'fft', 'graph matchings', 'ternary search', 'expression parsing', 'meet-in-the-middle',
    '2-sat', 'chinese remainder theorem', 'schedules'
  ];

  const untouchedTags = allCfTags.filter(t => !tagCounts[t] || tagCounts[t] < 2);

  // === Rating Analysis ===
  const solvedRatings = solvedProblems.map(s => s.problem?.rating).filter(r => r && typeof r === 'number');
  const maxSolvedRating = solvedRatings.length > 0 ? Math.max(...solvedRatings) : 800;
  const avgSolvedRating = solvedRatings.length > 0 ? Math.round(solvedRatings.reduce((a, b) => a + b, 0) / solvedRatings.length) : 800;
  const medianSolvedRating = solvedRatings.length > 0 ? solvedRatings.sort((a, b) => a - b)[Math.floor(solvedRatings.length / 2)] : 800;

  // Rating distribution
  const ratingDist = {};
  solvedRatings.forEach(r => {
    const bucket = Math.floor(r / 100) * 100;
    ratingDist[bucket] = (ratingDist[bucket] || 0) + 1;
  });

  // === Contest Analysis ===
  const currentRating = user?.rating || (ratings.length > 0 ? ratings[ratings.length - 1]?.newRating : 0);
  const maxRating = user?.maxRating || (ratings.length > 0 ? Math.max(...ratings.map(r => r.newRating)) : 0);
  const contestCount = ratings.length;

  // Rating changes
  const ratingChanges = ratings.map(r => r.newRating - r.oldRating);
  const positiveContests = ratingChanges.filter(c => c > 0).length;
  const negativeContests = ratingChanges.filter(c => c < 0).length;
  const avgRatingChange = ratingChanges.length > 0 ? Math.round(ratingChanges.reduce((a, b) => a + b, 0) / ratingChanges.length) : 0;
  const contestWinRate = contestCount > 0 ? ((positiveContests / contestCount) * 100) : 0;

  // Recent form (last 5 contests)
  const recentContests = ratings.slice(-5);
  const recentAvgRating = recentContests.length > 0
    ? Math.round(recentContests.reduce((a, b) => a + b.newRating, 0) / recentContests.length)
    : currentRating;
  const recentChanges = recentContests.map(r => r.newRating - r.oldRating);
  const recentTrend = recentChanges.length > 0 ? Math.round(recentChanges.reduce((a, b) => a + b, 0) / recentChanges.length) : 0;

  // Contests per month
  let contestsPerMonth = 0;
  if (ratings.length >= 2) {
    const firstContest = ratings[0].ratingUpdateTimeSeconds;
    const lastContest = ratings[ratings.length - 1].ratingUpdateTimeSeconds;
    const monthSpan = Math.max(1, (lastContest - firstContest) / (30 * 24 * 3600));
    contestsPerMonth = Math.round((contestCount / monthSpan) * 10) / 10;
  }

  // === Streak & Consistency ===
  const submissionDates = new Set();
  subs.forEach(s => {
    if (s.creationTimeSeconds) {
      const d = new Date(s.creationTimeSeconds * 1000);
      submissionDates.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  });

  // Current streak
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

  // Problems solved in last 7 / 30 days
  const now = Date.now();
  const last7dSolved = new Set();
  const last30dSolved = new Set();
  okSubs.forEach(s => {
    const cid = s.problem?.contestId || s.contestId;
    const idx = s.problem?.index || s.index;
    const key = `${cid}-${idx}`;
    const age = now - (s.creationTimeSeconds || 0) * 1000;
    if (age <= 7 * 86400000) last7dSolved.add(key);
    if (age <= 30 * 86400000) last30dSolved.add(key);
  });

  const problemsPerWeek = last30dSolved.size > 0 ? Math.round((last30dSolved.size / 30) * 7 * 10) / 10 : 0;

  // === Difficulty Progression (recent vs older) ===
  const recentSolvedRatings = [];
  const olderSolvedRatings = [];
  solvedProblems.forEach(s => {
    const r = s.problem?.rating;
    const age = now - (s.creationTimeSeconds || 0) * 1000;
    if (r) {
      if (age <= 30 * 86400000) recentSolvedRatings.push(r);
      else olderSolvedRatings.push(r);
    }
  });

  const recentMedian = recentSolvedRatings.length > 0
    ? recentSolvedRatings.sort((a, b) => a - b)[Math.floor(recentSolvedRatings.length / 2)]
    : avgSolvedRating;
  const olderMedian = olderSolvedRatings.length > 0
    ? olderSolvedRatings.sort((a, b) => a - b)[Math.floor(olderSolvedRatings.length / 2)]
    : avgSolvedRating;

  // === Bottleneck Detection ===
  let biggestBottleneck = '';
  let bottleneckDetail = '';

  if (acceptRate < 40) {
    biggestBottleneck = 'Low Acceptance Rate';
    bottleneckDetail = `Your acceptance rate is ${acceptRate.toFixed(1)}%. This suggests rushing into submissions. Focus on thinking through edge cases before submitting.`;
  } else if (contestCount < 5) {
    biggestBottleneck = 'Insufficient Contest Experience';
    bottleneckDetail = `Only ${contestCount} rated contests. Real rating growth requires consistent contest participation — aim for 2+ contests per month.`;
  } else if (contestWinRate < 35) {
    biggestBottleneck = 'Negative Contest Trend';
    bottleneckDetail = `Only ${positiveContests} of ${contestCount} contests gained rating (${contestWinRate.toFixed(0)}% win rate). Consider more virtual contests to practice under time pressure.`;
  } else if (currentStreak === 0 && problemsPerWeek < 3) {
    biggestBottleneck = 'Practice Inconsistency';
    bottleneckDetail = `No active streak and only ~${problemsPerWeek} problems/week. Consistent daily practice is the #1 predictor of rating growth.`;
  } else if (weakTags.length > 0 && strongTags.length > 0 && strongTags[0][1] > (weakTags[0]?.[1] || 0) * 5) {
    biggestBottleneck = 'Topic Imbalance';
    bottleneckDetail = `Heavy focus on ${strongTags[0][0]} (${strongTags[0][1]} solved) while neglecting topics like ${weakTags.map(t => t[0]).slice(0, 3).join(', ')}. Diversify to cover contest problem variety.`;
  } else if (recentMedian <= olderMedian) {
    biggestBottleneck = 'Difficulty Plateau';
    bottleneckDetail = `Recent median difficulty (${recentMedian}) hasn't increased from older solves (${olderMedian}). Push yourself with harder problems at your target rating.`;
  } else {
    biggestBottleneck = 'Sustain the Momentum';
    bottleneckDetail = 'Your profile looks well-rounded. Focus on maintaining consistency and gradually increasing difficulty.';
  }

  return {
    // Identity
    handle: user?.handle || 'Unknown',
    currentRating,
    maxRating,
    rank: user?.rank || 'Unrated',

    // Solve Stats
    totalSubmissions,
    uniqueSolved,
    acceptRate: Math.round(acceptRate * 10) / 10,

    // Tags
    tagCounts,
    tagRatings,
    strongTags,
    weakTags,
    untouchedTags,
    sortedTags,

    // Ratings
    maxSolvedRating,
    avgSolvedRating,
    medianSolvedRating,
    ratingDist,
    solvedRatings,

    // Contests
    contestCount,
    positiveContests,
    negativeContests,
    avgRatingChange,
    contestWinRate: Math.round(contestWinRate * 10) / 10,
    contestsPerMonth,
    recentAvgRating,
    recentTrend,

    // Consistency
    currentStreak,
    problemsPerWeek,
    last7dSolved: last7dSolved.size,
    last30dSolved: last30dSolved.size,

    // Progression
    recentMedian,
    olderMedian,

    // Bottleneck
    biggestBottleneck,
    bottleneckDetail,
  };
}

// ─── Generate Weekly Plan from Real Data ───────────────────

function generateWeeklyPlan(analysis, targetRating) {
  const { currentRating, strongTags, weakTags, untouchedTags, avgSolvedRating, contestCount, acceptRate, tagCounts } = analysis;
  const delta = Math.max(0, targetRating - (currentRating || 0));
  const totalWeeks = estimateWeeks(currentRating || 800, targetRating, analysis.contestsPerMonth || 1);

  // Build difficulty milestones
  const startDifficulty = Math.max(800, avgSolvedRating - 100);
  const endDifficulty = Math.min(3500, targetRating + 100);
  const difficultyStep = Math.max(50, Math.round((endDifficulty - startDifficulty) / Math.max(1, totalWeeks)));

  const weeks = [];

  // Determine topic rotation based on real data
  const topicPool = [];

  // Weak tags get more focus
  weakTags.forEach(([tag]) => topicPool.push(tag));
  untouchedTags.slice(0, 5).forEach(t => topicPool.push(t));
  // Strong tags for confidence
  strongTags.slice(0, 3).forEach(([tag]) => topicPool.push(tag));

  // Rating-tier appropriate topics
  const tierTopics = {};
  tierTopics['< 1200'] = ['implementation', 'math', 'greedy', 'brute force', 'strings', 'constructive algorithms'];
  tierTopics['1200-1600'] = ['binary search', 'two pointers', 'dp', 'graphs', 'dfs and similar', 'sortings', 'number theory', 'trees'];
  tierTopics['1600-2000'] = ['dp', 'data structures', 'dsu', 'shortest paths', 'bitmasks', 'combinatorics', 'divide and conquer'];
  tierTopics['2000+'] = ['flows', 'fft', 'string suffix structures', 'geometry', 'games', 'matrices', 'graph matchings'];

  function getTierTopics(rating) {
    if (rating < 1200) return tierTopics['< 1200'];
    if (rating < 1600) return tierTopics['1200-1600'];
    if (rating < 2000) return tierTopics['1600-2000'];
    return tierTopics['2000+'];
  }

  for (let w = 0; w < totalWeeks; w++) {
    const weekRating = Math.min(endDifficulty, startDifficulty + difficultyStep * w);
    const weekRatingMax = Math.min(endDifficulty, weekRating + difficultyStep);
    const phase = w < totalWeeks * 0.3 ? 'foundation' : w < totalWeeks * 0.7 ? 'growth' : 'peak';

    // Rotate through topics
    const tierAppropriate = getTierTopics(weekRating);
    const weekTopics = [];

    // Pick 2-3 topics: at least 1 weak, 1 tier-appropriate
    if (weakTags.length > 0) {
      weekTopics.push(weakTags[w % weakTags.length][0]);
    }
    weekTopics.push(tierAppropriate[w % tierAppropriate.length]);
    if (strongTags.length > 0 && w % 2 === 0) {
      weekTopics.push(strongTags[w % strongTags.length][0]);
    }

    // Deduplicate
    const uniqueTopics = [...new Set(weekTopics)].slice(0, 3);

    const dailyEasy = phase === 'foundation' ? 3 : 2;
    const dailyTarget = phase === 'peak' ? 3 : 2;
    const dailyRevision = 1;

    let contestRecommendation = '';
    if (contestCount < 10) {
      contestRecommendation = w % 2 === 0 ? 'Participate in 1 rated contest' : 'Do 1 virtual contest from a past Div. 2/3 round';
    } else {
      contestRecommendation = w % 2 === 0 ? 'Participate in any rated contest available' : 'Virtual contest: pick a past contest rated near your level';
    }

    let milestone = '';
    if (w === 0) milestone = 'Build momentum — get comfortable with daily practice routine';
    else if (w === Math.floor(totalWeeks * 0.25)) milestone = `Checkpoint: should be solving ${weekRating}-rated problems consistently`;
    else if (w === Math.floor(totalWeeks * 0.5)) milestone = `Halfway mark: target difficulty should feel challenging but doable`;
    else if (w === Math.floor(totalWeeks * 0.75)) milestone = `Final push: contest performance should show improvement`;
    else if (w === totalWeeks - 1) milestone = `Goal week: aim to reach ${targetRating} in a rated contest!`;

    weeks.push({
      week: w + 1,
      phase,
      ratingRange: `${weekRating}–${weekRatingMax}`,
      ratingMin: weekRating,
      ratingMax: weekRatingMax,
      topics: uniqueTopics,
      dailyPlan: {
        easy: dailyEasy,
        target: dailyTarget,
        revision: dailyRevision,
      },
      contest: contestRecommendation,
      milestone,
      goals: [
        `Solve ${dailyEasy + dailyTarget} problems daily in range ${weekRating}–${weekRatingMax}`,
        `Focus topics: ${uniqueTopics.join(', ')}`,
        contestRecommendation,
        phase === 'foundation' ? 'Read editorials for every problem you cannot solve within 30 min' :
          phase === 'growth' ? 'Upsolve at least 1 contest problem you missed' :
            'Simulate full contest timing — solve A-D within 2 hours',
      ],
    });
  }

  return weeks;
}

// ─── Generate Topic Progression from Real Solves ───────────

function generateTopicProgression(analysis, targetRating) {
  const { tagCounts, tagRatings, currentRating } = analysis;
  const startRating = currentRating || 800;

  // Pick the most important topics for the user's target tier
  const relevantTopics = [];
  const allTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  // Include top 3 strong + top 3 weak + any untouched critical ones
  const strong = allTags.slice(0, 3).map(([t]) => t);
  const weak = allTags.slice(-3).map(([t]) => t);
  const critical = ['dp', 'graphs', 'binary search', 'math', 'greedy', 'data structures']
    .filter(t => !strong.includes(t) && !weak.includes(t));

  const topicList = [...new Set([...strong, ...weak, ...critical.slice(0, 2)])].slice(0, 6);

  topicList.forEach(topic => {
    const solvedCount = tagCounts[topic] || 0;
    const ratings = tagRatings[topic] || [];
    const maxInTopic = ratings.length > 0 ? Math.max(...ratings) : 800;
    const avgInTopic = ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 800;

    // Build progression ladder
    const ladderStart = Math.max(800, Math.floor(avgInTopic / 100) * 100);
    const ladderEnd = Math.min(3500, targetRating + 200);
    const steps = [];

    for (let r = ladderStart; r <= ladderEnd; r += 200) {
      const solvedAtLevel = ratings.filter(x => x >= r && x < r + 200).length;
      steps.push({
        rating: r,
        solved: solvedAtLevel,
        target: Math.max(3, 5 - Math.floor(solvedAtLevel / 2)),
        completed: solvedAtLevel >= 3,
      });
    }

    relevantTopics.push({
      topic,
      solvedCount,
      maxRating: maxInTopic,
      avgRating: avgInTopic,
      isStrong: strong.includes(topic),
      steps,
    });
  });

  return relevantTopics;
}

// ─── Generate Checklist from Real Data ─────────────────────

function generateChecklist(analysis, targetRating, weeklyPlan) {
  const { uniqueSolved, currentStreak, contestCount, acceptRate, weakTags, strongTags, avgSolvedRating } = analysis;
  const items = [];

  // Dynamic problem count targets
  const targetProblems = Math.max(10, Math.ceil((targetRating - (analysis.currentRating || 800)) / 15));
  items.push({ id: 'solve_target', text: `Solve ${targetProblems} problems rated ${Math.min(3500, avgSolvedRating + 100)}+`, done: false });

  // Weak topic targets
  weakTags.slice(0, 3).forEach(([tag, count]) => {
    const target = Math.max(5, 10 - count);
    items.push({ id: `weak_${tag}`, text: `Solve ${target} more "${tag}" problems`, done: false });
  });

  // Contest targets
  const contestTarget = Math.max(4, Math.ceil(weeklyPlan.length / 2));
  items.push({ id: 'contests', text: `Participate in ${contestTarget} rated contests`, done: false });

  // Streak target
  items.push({ id: 'streak', text: `Maintain a ${Math.max(7, currentStreak + 3)}-day solving streak`, done: currentStreak >= 7 });

  // Acceptance rate target
  if (acceptRate < 60) {
    items.push({ id: 'accept', text: `Improve acceptance rate to ${Math.min(75, Math.round(acceptRate + 15))}%`, done: false });
  }

  // Upsolving
  items.push({ id: 'upsolve', text: `Upsolve ${Math.max(5, Math.ceil(contestTarget * 1.5))} contest problems after each round`, done: false });

  // Virtual contests
  items.push({ id: 'virtual', text: `Complete ${Math.max(3, Math.ceil(weeklyPlan.length / 3))} virtual contests`, done: false });

  // Rating target
  items.push({ id: 'rating_goal', text: `Reach ${targetRating} rating in a rated contest`, done: (analysis.currentRating || 0) >= targetRating });

  return items;
}

// ─── Main Component ────────────────────────────────────────

export default function RoadmapView({ submissions = [], user = null, ratingHistory = [] }) {
  const [targetRating, setTargetRating] = useState('');
  const [generatedTarget, setGeneratedTarget] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState({0: true});
  const [checklist, setChecklist] = useState(loadChecklist());
  const [aiNarrative, setAiNarrative] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [rateLimitData, setRateLimitData] = useState(null);
  const [isRateLimitOpen, setIsRateLimitOpen] = useState(false);

  // Compute all analysis from real data
  const analysis = useMemo(() => analyzeProfile(submissions, ratingHistory, user), [submissions, ratingHistory, user]);

  // Auto-calculate a sensible default target
  const autoTarget = useMemo(() => {
    const tier = getRankTier(analysis.currentRating);
    return tier.next || (analysis.currentRating + 200);
  }, [analysis.currentRating]);

  const effectiveTarget = generatedTarget || autoTarget;

  // Weekly plan, topic progression, checklist — all from real data
  const weeklyPlan = useMemo(() => generateWeeklyPlan(analysis, effectiveTarget), [analysis, effectiveTarget]);
  const topicProgression = useMemo(() => generateTopicProgression(analysis, effectiveTarget), [analysis, effectiveTarget]);
  const checklistItems = useMemo(() => generateChecklist(analysis, effectiveTarget, weeklyPlan), [analysis, effectiveTarget, weeklyPlan]);

  const currentTier = getRankTier(analysis.currentRating);
  const targetTier = getRankTier(effectiveTarget);
  const estWeeks = estimateWeeks(analysis.currentRating, effectiveTarget, analysis.contestsPerMonth || 1);

  const handleGenerate = useCallback(() => {
    const parsed = parseInt(targetRating);
    if (parsed && parsed > (analysis.currentRating || 0)) {
      setGeneratedTarget(parsed);
    } else {
      setGeneratedTarget(autoTarget);
    }
    setExpandedWeeks({0: true});
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

  // Fetch AI narrative for coaching commentary
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

  // Auto-generate on mount
  useEffect(() => {
    if (analysis.handle && analysis.totalSubmissions > 0) {
      fetchAiNarrative(autoTarget);
    }
  }, [analysis.handle]);

  const completedChecks = checklistItems.filter(item => checklist[item.id]).length;
  const checklistProgress = checklistItems.length > 0 ? Math.round((completedChecks / checklistItems.length) * 100) : 0;

  // Practice ratio computed from real data
  const practiceRatio = useMemo(() => {
    const total = analysis.totalSubmissions || 1;
    const contestSubs = submissions.filter(s => {
      const t = s.author?.participantType;
      return t === 'CONTESTANT' || t === 'VIRTUAL';
    }).length;
    const revisionSubs = submissions.filter(s => {
      return s.author?.participantType === 'PRACTICE' && s.verdict === 'OK';
    }).length;
    const practiceSubs = total - contestSubs;

    return {
      practice: Math.round((practiceSubs / total) * 100),
      contest: Math.round((contestSubs / total) * 100),
      revision: Math.min(100 - Math.round((practiceSubs / total) * 100) - Math.round((contestSubs / total) * 100), 100),
    };
  }, [submissions, analysis.totalSubmissions]);

  return (
    <div>
      {/* ═══ Header ═══ */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Map size={22} style={{ color: 'var(--accent-blue)' }} />
          Personalized CP Roadmap
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Data-driven training plan built from your {analysis.totalSubmissions.toLocaleString()} submissions, {analysis.contestCount} contests, and {analysis.uniqueSolved} unique solves.
        </p>
      </div>

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
              <button className="btn-primary-sm" onClick={handleGenerate} disabled={aiLoading}>
                {aiLoading ? <RefreshCw size={14} className="spinner" /> : <Rocket size={14} />}
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
            Current Assessment
          </h3>
          <span className="status-badge" style={{ background: currentTier.color + '20', color: currentTier.color, borderColor: currentTier.color + '40' }}>
            {currentTier.name}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Rating Stats */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>Rating</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: currentTier.color, fontFamily: 'var(--font-mono)' }}>{analysis.currentRating || 'Unrated'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Peak: <strong style={{ color: 'var(--text-main)' }}>{analysis.maxRating}</strong> · Estimated skill: <strong style={{ color: 'var(--text-main)' }}>{analysis.recentAvgRating}</strong>
            </div>
          </div>

          {/* Solve Stats */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>Solve Stats</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>{analysis.uniqueSolved}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              unique solved · {analysis.acceptRate}% AC rate · avg difficulty <strong style={{ color: 'var(--text-main)' }}>{analysis.avgSolvedRating}</strong>
            </div>
          </div>

          {/* Contest Performance */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>Contests</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>{analysis.contestCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {analysis.positiveContests}↑ {analysis.negativeContests}↓ · {analysis.contestWinRate}% win · avg Δ{analysis.avgRatingChange > 0 ? '+' : ''}{analysis.avgRatingChange}
            </div>
          </div>

          {/* Consistency */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>Consistency</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: analysis.currentStreak > 0 ? 'var(--accent-orange)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {analysis.currentStreak}d
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>streak</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {analysis.problemsPerWeek} problems/week · {analysis.last7dSolved} solved this week
            </div>
          </div>
        </div>

        {/* Strong / Weak Tags */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ background: 'rgba(34, 197, 94, 0.04)', border: '1px solid rgba(34, 197, 94, 0.15)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Star size={12} /> Strong Topics
            </div>
            {analysis.strongTags.length > 0 ? analysis.strongTags.map(([tag, count]) => (
              <div key={tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-main)', textTransform: 'capitalize' }}>{tag}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (count / (analysis.strongTags[0]?.[1] || 1)) * 100)}%`, height: '100%', background: 'var(--accent-green)', borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '30px', textAlign: 'right' }}>{count}</span>
                </div>
              </div>
            )) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not enough data yet</span>}
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-red)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={12} /> Weak / Untouched Topics
            </div>
            {(analysis.weakTags.length > 0 || analysis.untouchedTags.length > 0) ? (
              <>
                {analysis.weakTags.map(([tag, count]) => (
                  <div key={tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-main)', textTransform: 'capitalize' }}>{tag}</span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>only {count}</span>
                  </div>
                ))}
                {analysis.untouchedTags.slice(0, 3).map(tag => (
                  <div key={tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{tag}</span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>untouched</span>
                  </div>
                ))}
              </>
            ) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All topics well covered!</span>}
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

      {/* ═══ AI Coaching Commentary ═══ */}
      {aiNarrative?.assessment && (
        <div className="ent-card" style={{ marginBottom: '1.5rem', borderLeft: '3px solid var(--accent-purple)' }}>
          <div className="ent-card-header">
            <h3 className="ent-card-title">
              <Brain size={18} style={{ color: 'var(--accent-purple)' }} />
              AI Coaching Assessment
            </h3>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>Powered by your real telemetry data</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
            {aiNarrative.assessment}
          </p>
        </div>
      )}

      {/* ═══ Section 2: Weekly Roadmap ═══ */}
      <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <Calendar size={18} style={{ color: 'var(--accent-blue)' }} />
            Weekly Roadmap ({weeklyPlan.length} weeks)
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                    ★ {w.ratingRange}
                  </span>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {w.topics.map(t => (
                      <span key={t} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: '3px', padding: '0.1rem 0.4rem', color: 'var(--text-muted)' }}>{t}</span>
                    ))}
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                      {/* Daily Plan */}
                      <div>
                        <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Daily Practice</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                          <div>☀️ {w.dailyPlan.easy} warm-up problems (rating {Math.max(800, w.ratingMin - 200)})</div>
                          <div>🎯 {w.dailyPlan.target} target problems (rating {w.ratingRange})</div>
                          <div>🔄 {w.dailyPlan.revision} revision of previously failed problem</div>
                        </div>
                      </div>

                      {/* Goals */}
                      <div>
                        <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Goals</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                          {w.goals.map((g, gi) => (
                            <div key={gi}>• {g}</div>
                          ))}
                        </div>
                      </div>

                      {/* Contest */}
                      <div>
                        <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Contest</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.contest}</div>
                      </div>
                    </div>

                    {/* Milestone */}
                    {w.milestone && (
                      <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', background: phaseColor + '12', border: `1px solid ${phaseColor}30`, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trophy size={14} style={{ color: phaseColor }} />
                        <span style={{ fontSize: '0.8rem', color: phaseColor, fontWeight: 600 }}>{w.milestone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ Section 3: Daily Routine ═══ */}
      <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <Clock size={18} style={{ color: 'var(--accent-orange)' }} />
            Recommended Daily Routine
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {[
            { icon: '☀️', title: 'Warm-up', desc: `2 easy problems (${Math.max(800, analysis.avgSolvedRating - 200)}-rated)`, time: '15–20 min', color: 'var(--accent-green)' },
            { icon: '🎯', title: 'Main Practice', desc: `2 target problems (${Math.min(3500, analysis.avgSolvedRating + 100)}-rated)`, time: '60–90 min', color: 'var(--accent-blue)' },
            { icon: '🔄', title: 'Revision', desc: '1 previously failed problem', time: '20–30 min', color: 'var(--accent-purple)' },
            { icon: '📖', title: 'Editorial Study', desc: 'Read editorial for any unsolved problem', time: '15 min', color: 'var(--accent-orange)' },
            { icon: '📝', title: 'Upsolving', desc: "Reattempt yesterday's missed problems", time: '30 min', color: 'var(--accent-red)' },
          ].map((slot, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{slot.icon}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>{slot.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', lineHeight: '1.5' }}>{slot.desc}</div>
              <span style={{ fontSize: '0.675rem', background: slot.color + '15', color: slot.color, border: `1px solid ${slot.color}30`, padding: '0.15rem 0.45rem', borderRadius: '9999px', fontWeight: 600 }}>{slot.time}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.775rem', color: 'var(--text-subtle)' }}>
          💡 Weekend: Replace main practice with a virtual contest from a past Div. {analysis.currentRating < 1600 ? '3 or 4' : '2'} round. Upsolve all unsolved problems after.
        </div>
      </div>

      {/* ═══ Section 4: Topic Progression ═══ */}
      <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <TrendingUp size={18} style={{ color: 'var(--accent-green)' }} />
            Topic Progression Ladder
          </h3>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>Based on your {analysis.uniqueSolved} solved problems</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {topicProgression.map((tp, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>{tp.topic}</span>
                  <span style={{ fontSize: '0.7rem', color: tp.isStrong ? 'var(--accent-green)' : 'var(--accent-red)', marginLeft: '0.5rem', fontWeight: 600 }}>
                    {tp.isStrong ? '★ Strong' : '⚠ Needs Work'}
                  </span>
                </div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{tp.solvedCount} solved</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {tp.steps.map((step, si) => (
                  <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {step.completed ? (
                      <CheckCircle2 size={14} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                    ) : (
                      <Circle size={14} style={{ color: 'var(--border-muted)', flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '35px' }}>{step.rating}</span>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (step.solved / Math.max(1, step.target)) * 100)}%`, height: '100%', background: step.completed ? 'var(--accent-green)' : 'var(--accent-blue)', borderRadius: '2px', transition: 'var(--transition)' }} />
                    </div>
                    <span style={{ fontSize: '0.675rem', color: step.completed ? 'var(--accent-green)' : 'var(--text-subtle)', fontFamily: 'var(--font-mono)', minWidth: '40px', textAlign: 'right' }}>
                      {step.solved}/{step.target}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Section 5: Contest Strategy ═══ */}
      <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <Shield size={18} style={{ color: 'var(--accent-blue)' }} />
            Contest Strategy
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '0.4rem' }}>📊 Contest Frequency</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
              {analysis.contestsPerMonth < 2
                ? `You average ${analysis.contestsPerMonth} contests/month. Aim for 2–3 rated contests per month to build contest stamina and rating.`
                : `You average ${analysis.contestsPerMonth} contests/month — good frequency. Maintain this pace for consistent rating growth.`
              }
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '0.4rem' }}>🔄 Upsolving Strategy</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
              After every contest, upsolve the first problem you couldn't solve within the time limit. Read the editorial, implement from scratch, then try a similar problem. This is the fastest way to grow.
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '0.4rem' }}>🏋️ Virtual Contests</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
              {analysis.contestCount < 10
                ? `With only ${analysis.contestCount} contests, do 1–2 virtual contests per week from past Div. ${analysis.currentRating < 1600 ? '3/4' : '2'} rounds to build speed and confidence.`
                : `Use virtual contests weekly to practice time management. Pick rounds where problem C/D match your target difficulty (${Math.min(3500, analysis.avgSolvedRating + 200)}).`
              }
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-orange)', marginBottom: '0.4rem' }}>📓 Mistake Notebook</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
              Your WA/TLE rate is {(100 - analysis.acceptRate).toFixed(0)}%. Keep a notebook: for each failed submission, note the problem, your wrong approach, and the correct insight. Review weekly.
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Section 6: Practice Ratio & Recommendations ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Practice Ratio */}
        <div className="ent-card">
          <div className="ent-card-header">
            <h3 className="ent-card-title">
              <Dumbbell size={18} style={{ color: 'var(--accent-purple)' }} />
              Your Practice Ratio
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              {[
                { label: 'Practice', value: practiceRatio.practice, color: 'var(--accent-blue)' },
                { label: 'Contests', value: practiceRatio.contest, color: 'var(--accent-green)' },
                { label: 'Other', value: practiceRatio.revision, color: 'var(--accent-purple)' },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: item.color, fontFamily: 'var(--font-mono)' }}>{item.value}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.value}%`, height: '100%', background: item.color, borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
            {practiceRatio.contest < 15
              ? '⚠️ Low contest ratio. Increase rated contest participation for real growth.'
              : practiceRatio.contest > 50
                ? '⚠️ High contest ratio relative to practice. Add more focused practice sessions.'
                : '✓ Balanced ratio. Keep maintaining this distribution.'}
          </div>
        </div>

        {/* Recommendations */}
        <div className="ent-card">
          <div className="ent-card-header">
            <h3 className="ent-card-title">
              <Lightbulb size={18} style={{ color: 'var(--accent-orange)' }} />
              Personalized Recommendations
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <strong style={{ color: 'var(--accent-green)' }}>Focus on:</strong>{' '}
              {analysis.weakTags.slice(0, 3).map(([t]) => t).join(', ') || 'Diversify your topic coverage'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <strong style={{ color: 'var(--accent-orange)' }}>Avoid for now:</strong>{' '}
              {analysis.currentRating < 1400
                ? 'Advanced DP, Segment Trees, Flows — focus on fundamentals first'
                : analysis.currentRating < 1800
                  ? 'FFT, Geometry, String suffix structures — too advanced for current level'
                  : 'Over-practicing easy problems below your level'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <strong style={{ color: 'var(--accent-blue)' }}>Target difficulty:</strong>{' '}
              Practice problems rated {Math.min(3500, analysis.avgSolvedRating + 50)}–{Math.min(3500, analysis.avgSolvedRating + 200)} for optimal growth
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <strong style={{ color: 'var(--accent-purple)' }}>Recent trend:</strong>{' '}
              {analysis.recentTrend > 0
                ? `+${analysis.recentTrend} avg per contest — you're on an upward trajectory! Push harder.`
                : analysis.recentTrend < 0
                  ? `${analysis.recentTrend} avg per contest — stabilize by solving more at current level before pushing higher.`
                  : 'Steady performance. Time to push your comfort zone with harder problems.'}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Section 7: AI Motivation ═══ */}
      <div className="ent-card" style={{ marginBottom: '1.5rem', borderLeft: '3px solid var(--accent-green)' }}>
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <Flame size={18} style={{ color: 'var(--accent-orange)' }} />
            {aiLoading ? 'Generating...' : 'Your Mentor Says'}
          </h3>
        </div>
        {aiLoading ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 0.75rem', width: '20px', height: '20px', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-green)', borderRadius: '50%' }} />
            Crafting personalized encouragement from your data...
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
            {aiNarrative?.motivation || (
              analysis.currentStreak > 3
                ? `You're on a ${analysis.currentStreak}-day streak — that kind of consistency is exactly what separates those who plateau from those who break through. With ${analysis.uniqueSolved} problems solved and a ${analysis.acceptRate}% acceptance rate, you have a solid foundation. Your next milestone is ${effectiveTarget} rating, and based on your recent performance (${analysis.recentTrend > 0 ? `trending +${analysis.recentTrend} per contest` : 'with room for improvement'}), this is absolutely within reach in the next ${estWeeks} weeks. Keep going — every problem you solve now is building the pattern recognition that wins contests.`
                : `You've solved ${analysis.uniqueSolved} unique problems and participated in ${analysis.contestCount} contests — that's real experience. Your strongest areas (${analysis.strongTags.slice(0, 2).map(([t]) => t).join(', ')}) show you have genuine problem-solving instinct. The gap to ${effectiveTarget} rating is ${effectiveTarget - (analysis.currentRating || 0)} points — achievable with focused, consistent effort. Start with daily practice: even 2-3 problems a day compounds rapidly. Your ${analysis.acceptRate}% accuracy shows you think carefully before submitting. Channel that precision into contest speed and you'll see results.`
            )}
          </p>
        )}
      </div>

      {/* ═══ Section 8: Learning Tips ═══ */}
      <div className="ent-card" style={{ marginBottom: '1.5rem' }}>
        <div className="ent-card-header">
          <h3 className="ent-card-title">
            <BookOpen size={18} style={{ color: 'var(--accent-blue)' }} />
            Learning Tips
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
          {[
            { title: '⏱️ Time Management', text: analysis.acceptRate > 70 ? 'Your accuracy is good — now work on speed. Set a 25-minute timer per problem during practice.' : 'Focus on understanding before speed. Take time to think through edge cases — accuracy beats speed at your level.' },
            { title: '🐛 Debugging', text: `With a ${(100 - analysis.acceptRate).toFixed(0)}% error rate, build a debug checklist: overflow, off-by-one, edge cases (n=1, empty input). Test with small cases before submitting.` },
            { title: '📖 Reading Editorials', text: 'Read editorials for EVERY problem rated above your current level, even ones you solved. The editorial approach may be cleaner and teach new patterns.' },
            { title: '🧩 Pattern Recognition', text: `Your top tags (${analysis.strongTags.slice(0, 3).map(([t]) => t).join(', ')}) show pattern familiarity. Now recognize patterns in unfamiliar tags to become well-rounded.` },
            { title: '⏭️ When to Skip', text: 'Stuck for 30+ minutes? Read the editorial hints (not full solution), try again for 15 min. If still stuck, read the full editorial and re-implement from scratch.' },
            { title: '🧠 Contest Mindset', text: analysis.contestWinRate > 50 ? 'Strong contest performance. Focus on solving 1 more problem per contest by improving your C/D problem speed.' : 'Don\'t fear rating drops — they\'re data. Each contest teaches you something. Focus on solving problems, not protecting rating.' },
          ].map((tip, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>{tip.title}</div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>{tip.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Section 9: Progress Checklist ═══ */}
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
