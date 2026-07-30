import { useEffect, useState, useCallback, useRef } from 'react';

const LEADER_TIMEOUT = 600; // ms to wait for second key after leader

export default function useKeyboardShortcuts({ onSelectPage, onSyncData, onToggleFocus, onOpenCmdPalette, onOpenShortcuts }) {
  const [leaderActive, setLeaderActive] = useState(false);
  const [leaderKey, setLeaderKey] = useState(null);
  const leaderTimer = useRef(null);

  const cancelLeader = useCallback(() => {
    setLeaderActive(false);
    setLeaderKey(null);
    if (leaderTimer.current) {
      clearTimeout(leaderTimer.current);
      leaderTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      // Don't trigger shortcuts when typing in inputs
      const tag = e.target.tagName.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;

      // Cmd+K always works
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenCmdPalette?.();
        return;
      }

      // All other shortcuts skip when in inputs
      if (isInput) return;

      // Leader key active — handle second key
      if (leaderActive && leaderKey === 'g') {
        cancelLeader();
        const keyMap = {
          d: 'dashboard',
          p: 'problems',
          s: 'submissions',
          c: 'contests',
          a: 'analytics',
          i: 'insights',
          b: 'bookmarks',
          n: 'notes',
        };
        const page = keyMap[e.key.toLowerCase()];
        if (page) {
          e.preventDefault();
          onSelectPage?.(page);
        }
        return;
      }

      // Start leader sequence
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setLeaderActive(true);
        setLeaderKey('g');
        leaderTimer.current = setTimeout(cancelLeader, LEADER_TIMEOUT);
        return;
      }

      // Single-key shortcuts
      switch (e.key.toLowerCase()) {
        case 'r':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onSyncData?.();
          }
          break;
        case 'f':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onToggleFocus?.();
          }
          break;
        case '?':
          e.preventDefault();
          onOpenShortcuts?.();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [leaderActive, leaderKey, cancelLeader, onSelectPage, onSyncData, onToggleFocus, onOpenCmdPalette, onOpenShortcuts]);

  return { leaderActive, leaderKey };
}
