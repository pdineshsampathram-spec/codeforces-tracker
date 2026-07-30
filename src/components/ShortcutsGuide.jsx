import React from 'react';
import { X, Command } from 'lucide-react';

const shortcuts = [
  {
    section: 'Navigation',
    items: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'P'], description: 'Go to Problems' },
      { keys: ['G', 'S'], description: 'Go to Submissions' },
      { keys: ['G', 'C'], description: 'Go to Contests' },
      { keys: ['G', 'A'], description: 'Go to Analytics' },
      { keys: ['G', 'I'], description: 'Go to Insights' },
      { keys: ['G', 'B'], description: 'Go to Bookmarks' },
      { keys: ['G', 'N'], description: 'Go to Notes' },
    ],
  },
  {
    section: 'Actions',
    items: [
      { keys: ['⌘', 'K'], description: 'Open Command Palette' },
      { keys: ['R'], description: 'Sync / Refresh Data' },
      { keys: ['F'], description: 'Toggle Focus Mode' },
      { keys: ['?'], description: 'Show this shortcuts guide' },
      { keys: ['Esc'], description: 'Close overlay / modal' },
    ],
  },
  {
    section: 'Command Palette',
    items: [
      { keys: ['↑', '↓'], description: 'Navigate items' },
      { keys: ['↵'], description: 'Select item' },
      { keys: ['Tab'], description: 'Switch category' },
      { keys: ['Esc'], description: 'Close palette' },
    ],
  },
];

export default function ShortcutsGuide({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-panel" onClick={e => e.stopPropagation()}>
        <div className="shortcuts-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Command size={18} style={{ color: 'var(--text-muted)' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Keyboard Shortcuts</h2>
          </div>
          <button className="shortcuts-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="shortcuts-body">
          {shortcuts.map(section => (
            <div key={section.section} className="shortcuts-section">
              <h3 className="shortcuts-section-title">{section.section}</h3>
              <div className="shortcuts-list">
                {section.items.map((item, i) => (
                  <div key={i} className="shortcuts-row">
                    <span className="shortcuts-desc">{item.description}</span>
                    <div className="shortcuts-keys">
                      {item.keys.map((k, j) => (
                        <React.Fragment key={j}>
                          {j > 0 && <span className="shortcuts-then">then</span>}
                          <kbd className="shortcuts-kbd">{k}</kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>
            Press <kbd className="shortcuts-kbd" style={{ fontSize: '0.65rem' }}>?</kbd> anytime to toggle this guide
          </span>
        </div>
      </div>
    </div>
  );
}
