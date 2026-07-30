import React, { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider, useToast } from './components/ToastNotification';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import CommandPalette from './components/CommandPalette';
import ShortcutsGuide from './components/ShortcutsGuide';
import FocusMode from './components/FocusMode';
import ProfileHero from './components/ProfileHero';
import StatCards from './components/StatCards';
import AnalyticsCharts from './components/AnalyticsCharts';
import ActivityHeatmap from './components/ActivityHeatmap';
import SkillRadar from './components/SkillRadar';
import SolvedProblems from './components/SolvedProblems';
import SubmissionsTable from './components/SubmissionsTable';
import UpcomingContests from './components/UpcomingContests';
import InsightsView from './components/InsightsView';
import CompareView from './components/CompareView';
import ProgressView from './components/ProgressView';
import BookmarksView from './components/BookmarksView';
import NotesView from './components/NotesView';
import CohortsView from './components/CohortsView';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { AlertCircle } from 'lucide-react';

function AppContent() {
  const [handle, setHandle] = useState('pdineshsampathram');
  const [activePage, setActivePage] = useState('dashboard');
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [apiAuthenticated, setApiAuthenticated] = useState(false);

  const toast = useToast();

  const fetchUserData = async (targetHandle, showFullLoading = true) => {
    if (showFullLoading) setLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`/api/user/${encodeURIComponent(targetHandle)}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch user data');
      }

      setData(json.data);
      if (!showFullLoading) {
        toast.success('Data synced successfully');
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message);
      toast.error(`Failed to fetch data: ${err.message}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetch('/api/status-check')
      .then(res => res.json())
      .then(json => setApiAuthenticated(json.authenticated))
      .catch(() => setApiAuthenticated(false));

    fetchUserData(handle, true);
  }, [handle]);

  const handleSearch = (newHandle) => {
    setHandle(newHandle);
    toast.info(`Switching to handle: ${newHandle}`);
  };

  const handleRefresh = useCallback(() => {
    fetchUserData(handle, false);
  }, [handle]);

  const handleSelectPage = useCallback((pageId) => {
    // Special actions from command palette
    if (pageId === '__focus_toggle') {
      setFocusModeActive(prev => !prev);
      return;
    }
    if (pageId === '__shortcuts') {
      setIsShortcutsOpen(true);
      return;
    }
    setActivePage(pageId);
  }, []);

  const handleToggleFocus = useCallback(() => {
    setFocusModeActive(prev => {
      const next = !prev;
      if (next) toast.info('Focus Mode activated');
      return next;
    });
  }, [toast]);

  const handleOpenCmdPalette = useCallback(() => {
    setIsCmdPaletteOpen(prev => !prev);
  }, []);

  const handleOpenShortcuts = useCallback(() => {
    setIsShortcutsOpen(prev => !prev);
  }, []);

  // Keyboard shortcuts
  const { leaderActive, leaderKey } = useKeyboardShortcuts({
    onSelectPage: handleSelectPage,
    onSyncData: handleRefresh,
    onToggleFocus: handleToggleFocus,
    onOpenCmdPalette: handleOpenCmdPalette,
    onOpenShortcuts: handleOpenShortcuts,
  });

  const getPageTitle = (pageId) => {
    switch (pageId) {
      case 'dashboard': return 'Dashboard Overview';
      case 'problems': return 'Solved Problems Explorer';
      case 'submissions': return 'Submissions History';
      case 'contests': return 'Contest Schedule';
      case 'analytics': return 'Deep Analytics';
      case 'insights': return 'AI Diagnostics & Insights';
      case 'compare': return 'Head-to-Head Comparison';
      case 'progress': return 'Goals, Streaks & Achievements';
      case 'bookmarks': return 'Problem Bookmarks';
      case 'notes': return 'Problem Notes';
      case 'cohorts': return 'Cohorts & Teams';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="app-layout">
      {/* Fixed Left Sidebar */}
      <Sidebar 
        activePage={activePage} 
        onSelectPage={handleSelectPage} 
        user={data?.user}
        focusModeActive={focusModeActive}
        onToggleFocus={handleToggleFocus}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Sticky Bar */}
        <TopBar
          activePageTitle={getPageTitle(activePage)}
          onOpenCmdPalette={() => setIsCmdPaletteOpen(true)}
          onSyncData={handleRefresh}
          isRefreshing={isRefreshing}
          apiAuthenticated={apiAuthenticated}
        />

        {/* Command Palette Overlay */}
        <CommandPalette
          isOpen={isCmdPaletteOpen}
          onClose={() => setIsCmdPaletteOpen(false)}
          onSelectPage={handleSelectPage}
          onSearchHandle={handleSearch}
          onSyncData={handleRefresh}
        />

        {/* Shortcuts Guide Overlay */}
        <ShortcutsGuide
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />

        {/* Focus Mode Overlay */}
        <FocusMode
          isActive={focusModeActive}
          onClose={() => setFocusModeActive(false)}
          onSessionComplete={(msg) => toast.success(msg)}
        />

        {/* Leader Key Indicator */}
        {leaderActive && (
          <div className="leader-indicator">
            <span className="leader-key">{leaderKey.toUpperCase()}</span>
            <span>→ waiting for next key...</span>
          </div>
        )}

        {/* Content Container */}
        <main className="page-container">
          {loading ? (
            <div className="ent-card" style={{ padding: '4rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem', width: '24px', height: '24px', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }}></div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Fetching live Codeforces data for <strong style={{ color: 'var(--accent-blue)' }}>{handle}</strong>...
              </p>
            </div>
          ) : error ? (
            <div className="ent-card" style={{ padding: '3rem', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <AlertCircle size={40} style={{ color: 'var(--accent-red)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Unable to load account data</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
              <button className="btn-primary-sm" style={{ margin: '0 auto' }} onClick={() => fetchUserData(handle, true)}>
                Try Again
              </button>
            </div>
          ) : data ? (
            <div>
              {/* PAGE 1: DASHBOARD */}
              {activePage === 'dashboard' && (
                <div>
                  <ProfileHero user={data.user} />
                  <StatCards submissions={data.submissions} />
                  <SkillRadar submissions={data.submissions} />
                  <ActivityHeatmap submissions={data.submissions} />
                  <SubmissionsTable submissions={data.submissions.slice(0, 10)} />
                </div>
              )}

              {/* PAGE 2: PROBLEMS EXPLORER */}
              {activePage === 'problems' && (
                <SolvedProblems submissions={data.submissions} />
              )}

              {/* PAGE 3: SUBMISSIONS HISTORY */}
              {activePage === 'submissions' && (
                <SubmissionsTable submissions={data.submissions} />
              )}

              {/* PAGE 4: CONTESTS */}
              {activePage === 'contests' && (
                <UpcomingContests />
              )}

              {/* PAGE 5: DEEP ANALYTICS */}
              {activePage === 'analytics' && (
                <div>
                  <AnalyticsCharts submissions={data.submissions} ratingHistory={data.ratingHistory} />
                </div>
              )}

              {/* PAGE 6: AI INSIGHTS */}
              {activePage === 'insights' && (
                <InsightsView submissions={data.submissions} user={data.user} />
              )}

              {/* PAGE 7: COMPARE USERS */}
              {activePage === 'compare' && (
                <CompareView userHandleA={handle} userAData={data} />
              )}

              {/* PAGE 8: PROGRESS & GOALS */}
              {activePage === 'progress' && (
                <ProgressView submissions={data.submissions} />
              )}

              {/* PAGE 9: BOOKMARKS */}
              {activePage === 'bookmarks' && (
                <BookmarksView />
              )}

              {/* PAGE 10: NOTES */}
              {activePage === 'notes' && (
                <NotesView />
              )}

              {/* PAGE 11: COHORTS & TEAMS */}
              {activePage === 'cohorts' && (
                <CohortsView activeHandle={handle} />
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}
