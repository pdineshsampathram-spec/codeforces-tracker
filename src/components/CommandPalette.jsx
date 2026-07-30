import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  LayoutDashboard,
  Trophy,
  FileText,
  Calendar,
  PieChart,
  Sparkles,
  Users2,
  Target,
  RefreshCw,
  UserSearch,
  Bookmark,
  StickyNote,
  ArrowRight,
  Clock,
  Command,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Hash,
  Zap,
} from 'lucide-react';

const RECENT_SEARCHES_KEY = 'cf_recent_searches';
const MAX_RECENT = 5;

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch { return []; }
}

function saveRecentSearch(query) {
  const recent = getRecentSearches().filter(s => s !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export default function CommandPalette({ isOpen, onClose, onSelectPage, onSearchHandle, onSyncData }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  const recentSearches = useMemo(() => isOpen ? getRecentSearches() : [], [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveCategory('all');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const commands = [
    // Pinned
    { id: 'sync', label: 'Sync Data', category: 'pinned', icon: RefreshCw, hint: 'R', action: () => { onSyncData(); onClose(); } },
    { id: 'cmd-search', label: 'Search User Handle', category: 'pinned', icon: UserSearch, hint: '↵', action: null },

    // Navigation
    { id: 'dashboard', label: 'Go to Dashboard', category: 'navigation', icon: LayoutDashboard, hint: 'G D', action: () => { onSelectPage('dashboard'); onClose(); } },
    { id: 'problems', label: 'Go to Problems Explorer', category: 'navigation', icon: Trophy, hint: 'G P', action: () => { onSelectPage('problems'); onClose(); } },
    { id: 'submissions', label: 'Go to Submissions Log', category: 'navigation', icon: FileText, hint: 'G S', action: () => { onSelectPage('submissions'); onClose(); } },
    { id: 'contests', label: 'Go to Contests', category: 'navigation', icon: Calendar, hint: 'G C', action: () => { onSelectPage('contests'); onClose(); } },
    { id: 'analytics', label: 'Go to Analytics', category: 'navigation', icon: PieChart, hint: 'G A', action: () => { onSelectPage('analytics'); onClose(); } },
    { id: 'insights', label: 'Go to AI Insights', category: 'navigation', icon: Sparkles, hint: 'G I', action: () => { onSelectPage('insights'); onClose(); } },
    { id: 'compare', label: 'Go to Compare Users', category: 'navigation', icon: Users2, hint: '', action: () => { onSelectPage('compare'); onClose(); } },
    { id: 'progress', label: 'Go to Progress & Goals', category: 'navigation', icon: Target, hint: '', action: () => { onSelectPage('progress'); onClose(); } },
    { id: 'bookmarks', label: 'Go to Bookmarks', category: 'navigation', icon: Bookmark, hint: '', action: () => { onSelectPage('bookmarks'); onClose(); } },
    { id: 'notes', label: 'Go to Notes', category: 'navigation', icon: StickyNote, hint: '', action: () => { onSelectPage('notes'); onClose(); } },

    // Actions
    { id: 'focus', label: 'Toggle Focus Mode', category: 'actions', icon: Zap, hint: 'F', action: () => { onSelectPage('__focus_toggle'); onClose(); } },
    { id: 'shortcuts', label: 'View Keyboard Shortcuts', category: 'actions', icon: Command, hint: '?', action: () => { onSelectPage('__shortcuts'); onClose(); } },
  ];

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'pinned', label: 'Pinned' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'actions', label: 'Actions' },
    { id: 'recent', label: 'Recent' },
  ];

  const filteredCommands = commands.filter(c => {
    const matchesQuery = !query || c.label.toLowerCase().includes(query.toLowerCase()) || c.category.includes(query.toLowerCase());
    const matchesCategory = activeCategory === 'all' || c.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  // Add recent searches as items when in "recent" category or when no query
  const recentItems = (activeCategory === 'recent' || (activeCategory === 'all' && !query))
    ? recentSearches.map((s, i) => ({
        id: `recent-${i}`,
        label: s,
        category: 'recent',
        icon: Clock,
        hint: '',
        action: () => { onSearchHandle(s); saveRecentSearch(s); onClose(); },
      }))
    : [];

  const allItems = [...filteredCommands, ...recentItems];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
      scrollToSelected(selectedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
      scrollToSelected(selectedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = allItems[selectedIndex];
      if (item && item.action) {
        item.action();
      } else if (query.trim()) {
        onSearchHandle(query.trim());
        saveRecentSearch(query.trim());
        onClose();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const catIds = categories.map(c => c.id);
      const idx = catIds.indexOf(activeCategory);
      setActiveCategory(catIds[(idx + 1) % catIds.length]);
      setSelectedIndex(0);
    }
  };

  function scrollToSelected(idx) {
    if (resultsRef.current) {
      const items = resultsRef.current.querySelectorAll('.cmd-item');
      if (items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
    }
  }

  // Group items by category for display
  const grouped = {};
  allItems.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const categoryLabels = {
    pinned: 'Pinned',
    navigation: 'Navigation',
    actions: 'Quick Actions',
    recent: 'Recent Searches',
  };

  let globalIndex = -1;

  return (
    <div className="cmd-palette-overlay" onClick={onClose}>
      <div className="cmd-palette" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="cmd-input-wrapper">
          <Search size={16} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command, search user handles..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <span className="kbd-badge">ESC</span>
        </div>

        {/* Category Tabs */}
        <div className="cmd-categories">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`cmd-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => { setActiveCategory(cat.id); setSelectedIndex(0); }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="cmd-results" ref={resultsRef}>
          {Object.entries(grouped).map(([catKey, items]) => (
            <div key={catKey}>
              {activeCategory === 'all' && (
                <div className="cmd-section-label">{categoryLabels[catKey] || catKey}</div>
              )}
              {items.map(cmd => {
                globalIndex++;
                const Icon = cmd.icon;
                const idx = globalIndex;
                return (
                  <div
                    key={cmd.id}
                    className={`cmd-item ${idx === selectedIndex ? 'selected' : ''}`}
                    onClick={() => {
                      if (cmd.action) cmd.action();
                      else if (query.trim()) { onSearchHandle(query.trim()); saveRecentSearch(query.trim()); onClose(); }
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <Icon size={15} style={{ flexShrink: 0, opacity: 0.7 }} />
                    <span className="cmd-item-label">{cmd.label}</span>
                    {cmd.hint && <span className="cmd-item-hint">{cmd.hint}</span>}
                    <ArrowRight size={12} className="cmd-item-arrow" />
                  </div>
                );
              })}
            </div>
          ))}

          {allItems.length === 0 && query.trim() && (
            <div
              className={`cmd-item ${selectedIndex === 0 ? 'selected' : ''}`}
              onClick={() => { onSearchHandle(query.trim()); saveRecentSearch(query.trim()); onClose(); }}
            >
              <UserSearch size={15} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
              <span className="cmd-item-label">
                Search user <strong>"{query.trim()}"</strong>
              </span>
              <span className="cmd-item-hint">↵ Enter</span>
            </div>
          )}

          {allItems.length === 0 && !query.trim() && (
            <div className="cmd-empty">
              No results found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="cmd-footer">
          <div className="cmd-footer-hint">
            <span className="kbd-badge" style={{ fontSize: '0.625rem' }}>↑↓</span>
            <span>Navigate</span>
          </div>
          <div className="cmd-footer-hint">
            <span className="kbd-badge" style={{ fontSize: '0.625rem' }}>↵</span>
            <span>Select</span>
          </div>
          <div className="cmd-footer-hint">
            <span className="kbd-badge" style={{ fontSize: '0.625rem' }}>Tab</span>
            <span>Category</span>
          </div>
          <div className="cmd-footer-hint">
            <span className="kbd-badge" style={{ fontSize: '0.625rem' }}>Esc</span>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
