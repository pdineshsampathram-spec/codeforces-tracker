import React from 'react';
import { 
  LayoutDashboard, 
  Trophy, 
  FileText, 
  Calendar, 
  PieChart, 
  Sparkles, 
  Users2, 
  Target, 
  Github, 
  Bookmark,
  StickyNote,
  CreditCard,
  Zap,
  Activity
} from 'lucide-react';

export default function Sidebar({ activePage, onSelectPage, user, focusModeActive, onToggleFocus }) {
  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'problems', label: 'Problems', icon: Trophy },
    { id: 'submissions', label: 'Submissions', icon: FileText },
    { id: 'contests', label: 'Contests', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
  ];

  const toolsNav = [
    { id: 'insights', label: 'Insights & AI', icon: Sparkles },
    { id: 'compare', label: 'Compare Users', icon: Users2 },
    { id: 'progress', label: 'Progress & Goals', icon: Target },
  ];

  const workspaceNav = [
    { id: 'cohorts', label: 'Cohorts & Teams', icon: Users2 },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
    { id: 'notes', label: 'Notes', icon: StickyNote },
  ];

  const userHandle = user ? user.handle : 'pdineshsampathram';
  const avatarUrl = user && user.avatar ? user.avatar : 'https://userpic.codeforces.org/no-avatar.jpg';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon-enterprise">CF</div>
        <span>Codeforces <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Pro</span></span>
      </div>

      <div className="sidebar-nav">
        <div className="sidebar-section-label">Main Platform</div>
        {mainNav.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPage(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="sidebar-section-label" style={{ marginTop: '0.75rem' }}>Intelligence & Tools</div>
        {toolsNav.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPage(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="sidebar-section-label" style={{ marginTop: '0.75rem' }}>Workspace</div>
        {workspaceNav.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPage(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div className="user-chip">
          <img src={avatarUrl} alt={userHandle} className="user-avatar-sm" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{userHandle}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>v2.0.0-pro</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={onToggleFocus}
            style={{
              background: focusModeActive ? 'var(--accent-blue-subtle)' : 'transparent',
              border: focusModeActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
              color: focusModeActive ? 'var(--accent-blue)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '0.3rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
            title="Toggle Focus Mode (F)"
          >
            <Zap size={15} />
          </button>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer" 
            style={{ color: 'var(--text-muted)', display: 'flex' }}
            title="GitHub Repository"
          >
            <Github size={16} />
          </a>
        </div>
      </div>
    </aside>
  );
}
