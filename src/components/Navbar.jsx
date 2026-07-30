import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  KeyRound, 
  ShieldCheck, 
  LayoutDashboard, 
  Trophy, 
  FileText, 
  PieChart, 
  Calendar 
} from 'lucide-react';

export default function Navbar({ 
  currentHandle, 
  onSearchHandle, 
  onRefresh, 
  isRefreshing, 
  apiAuthenticated,
  activePage,
  onSelectPage
}) {
  const [searchInput, setSearchInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchHandle(searchInput.trim());
      setSearchInput('');
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'solved', label: 'Solved Problems', icon: Trophy },
    { id: 'submissions', label: 'Submissions Log', icon: FileText },
    { id: 'analytics', label: 'Deep Analytics', icon: PieChart },
    { id: 'contests', label: 'Upcoming Contests', icon: Calendar },
  ];

  return (
    <header style={{ marginBottom: '2rem' }}>
      <nav className="navbar glass-card">
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => onSelectPage('overview')}>
          <div className="brand-icon">
            <Activity size={24} />
          </div>
          <div>
            <span>Codeforces</span>
            <span style={{ color: 'var(--primary)', marginLeft: '0.4rem' }}>Tracker</span>
          </div>
        </div>

        {/* Page Nav Items */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                style={{
                  background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  border: '1px solid',
                  borderColor: isActive ? 'rgba(56, 189, 248, 0.4)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  padding: '0.5rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="nav-controls">
          <form onSubmit={handleSubmit} className="search-form">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={`Handle: ${currentHandle}...`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>

          <button 
            className="btn-icon" 
            onClick={onRefresh} 
            title="Refresh Data"
            disabled={isRefreshing}
          >
            <RefreshCw size={18} className={isRefreshing ? 'spinner' : ''} />
          </button>

          {apiAuthenticated ? (
            <div className="badge-api" title="Authenticated with API Key & HMAC-SHA512 Signature">
              <ShieldCheck size={14} />
              <span>API Signed</span>
            </div>
          ) : (
            <div className="badge-api" style={{ borderColor: 'rgba(251, 191, 36, 0.3)', color: 'var(--accent-amber)' }}>
              <KeyRound size={14} />
              <span>Public API</span>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
