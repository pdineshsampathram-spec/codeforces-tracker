import React from 'react';
import { Search, RefreshCw, ShieldCheck, KeyRound, Bell } from 'lucide-react';

export default function TopBar({ 
  onOpenCmdPalette, 
  onSyncData, 
  isRefreshing, 
  apiAuthenticated, 
  activePageTitle 
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
          {activePageTitle || 'Dashboard'}
        </span>

        <button className="search-command-btn" onClick={onOpenCmdPalette}>
          <Search size={14} />
          <span>Search problems, users...</span>
          <span className="kbd-badge">⌘K</span>
        </button>
      </div>

      <div className="topbar-right">
        {apiAuthenticated ? (
          <div className="badge-status active" title="Authenticated via Codeforces HMAC-SHA512 API Key">
            <ShieldCheck size={13} />
            <span>API Signed</span>
          </div>
        ) : (
          <div className="badge-status" title="Public API Access">
            <KeyRound size={13} />
            <span>Public API</span>
          </div>
        )}

        <button className="btn-secondary-sm" onClick={onSyncData} disabled={isRefreshing}>
          <RefreshCw size={13} className={isRefreshing ? 'spinner' : ''} />
          <span>Sync Data</span>
        </button>

        <button className="btn-secondary-sm" style={{ padding: '0.45rem' }} title="Notifications">
          <Bell size={14} />
        </button>
      </div>
    </header>
  );
}
