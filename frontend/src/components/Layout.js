import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCity } from '../contexts/CityContext';
import ChatBot from './ChatBot';

const NAV_ITEMS = [
  { to: '/dashboard',  icon: '⚡', label: 'Dashboard' },
  { to: '/weather',    icon: '🌤️', label: 'Weather & AQI' },
  { to: '/hospitals',  icon: '🏥', label: 'Hospitals' },
  { to: '/tourism',    icon: '🗺️', label: 'Tourism' },
  { to: '/issues',     icon: '📣', label: 'Issues' },
  { to: '/analytics',  icon: '📊', label: 'Analytics' },
  { to: '/admin',      icon: '🛠️', label: 'Admin', adminOnly: true },
  { to: '/profile',    icon: '👤', label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { city, changeCity } = useCity();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cityInput, setCityInput] = useState(city);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPortal = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  // Sync input when city changes externally
  useEffect(() => { setCityInput(city); }, [city]);

  const handleCitySubmit = (e) => {
    e.preventDefault();
    if (cityInput.trim()) changeCity(cityInput.trim());
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* ─── Sidebar ─────────────────────────────────── */}
      <aside style={{
        width: sidebarOpen ? '260px' : '72px',
        minHeight: '100vh',
        background: 'rgba(5,11,24,0.9)',
        borderRight: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
          <span style={{ fontSize: '1.6rem' }}>🏙️</span>
          {sidebarOpen && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CityPulse</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-2px' }}>Smart City AI</div>
            </div>
          )}
        </div>

        {/* City Input */}
        {sidebarOpen && (
          <form onSubmit={handleCitySubmit} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <input
              className="form-input"
              placeholder="Enter city..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
            />
          </form>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
          {((user?.role === 'admin')
            ? NAV_ITEMS.filter((item) => ['/dashboard', '/analytics', '/admin', '/profile'].includes(item.to))
            : NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin')
          ).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 1.25rem',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                borderRight: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
              })}
            >
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        {sidebarOpen && user && (
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                {user.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : user.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => { logout(); navigate('/login'); }}>
              🚪 Logout
            </button>
          </div>
        )}
      </aside>

      {/* ─── Main Content ─────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          height: '68px', background: 'rgba(5,11,24,0.8)',
          borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {city && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📍 {city}</span>}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
          {!city && (
            <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
              💡 Enter a city name in the sidebar to load real-time data for that location.
            </div>
          )}
          <Outlet />
        </div>
      </main>

      {/* ─── AI Chatbot ───────────────────────────── */}
      <ChatBot city={city} />
    </div>
  );
}
