import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const INTEREST_OPTIONS = ['tourism', 'health', 'environment', 'infrastructure', 'food', 'nightlife', 'shopping', 'parks'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [loginHistory, setLoginHistory] = useState([]);
  const [histLoading,  setHistLoading]  = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [prefs, setPrefs] = useState({
    preferredCity:  user?.preferences?.preferredCity  || '',
    interests:      user?.preferences?.interests      || [],
    notifications:  user?.preferences?.notifications  || { aqi: true, weather: true, issues: true },
  });

  useEffect(() => {
    authAPI.loginHistory()
      .then((res) => setLoginHistory(res.data.history || []))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, []);

  const toggleInterest = (i) => {
    setPrefs((p) => ({
      ...p,
      interests: p.interests.includes(i) ? p.interests.filter((x) => x !== i) : [...p.interests, i],
    }));
  };

  const savePrefs = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updatePrefs(prefs);
      updateUser(res.data.user);
      toast.success('Preferences saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1>👤 Profile & Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your account, preferences, and security</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* User Info */}
        <div className="card fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 700, flexShrink: 0 }}>
              {user?.avatar
                ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : user?.name?.[0]?.toUpperCase()
              }
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.2rem' }}>{user?.name}</h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user?.email}</div>
              <span className={`badge ${user?.role === 'admin' ? 'badge-danger' : 'badge-info'}`} style={{ marginTop: '0.4rem' }}>{user?.role}</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Account Created</div>
            <div style={{ fontSize: '0.9rem' }}>{user?.createdAt ? formatDate(user.createdAt) : '—'}</div>
          </div>
          {user?.lastLogin && (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Last Login</div>
              <div style={{ fontSize: '0.9rem' }}>{formatDate(user.lastLogin)}</div>
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="card fade-up fade-up-1">
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.25rem' }}>⚙️ Preferences</h3>

          <div className="form-group">
            <label className="form-label">Preferred City</label>
            <input className="form-input" placeholder="e.g. Mumbai" value={prefs.preferredCity} onChange={(e) => setPrefs({ ...prefs, preferredCity: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Interests</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {INTEREST_OPTIONS.map((i) => (
                <button
                  key={i}
                  onClick={() => toggleInterest(i)}
                  className={`btn btn-sm ${prefs.interests.includes(i) ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ textTransform: 'capitalize' }}
                >{i}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notification Preferences</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                ['aqi',     '🌿 AQI Alerts'],
                ['weather', '🌤️ Weather Alerts'],
                ['issues',  '📣 Issue Updates'],
              ].map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  <input
                    type="checkbox"
                    checked={prefs.notifications[key]}
                    onChange={(e) => setPrefs({ ...prefs, notifications: { ...prefs.notifications, [key]: e.target.checked } })}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={savePrefs} disabled={saving} style={{ width: '100%' }}>
            {saving ? 'Saving…' : '💾 Save Preferences'}
          </button>
        </div>
      </div>

      {/* Login History */}
      <div className="card fade-up" style={{ marginTop: '1.25rem' }}>
        <div className="section-title" style={{ marginBottom: '1.25rem' }}>🔐 <span>Login History</span></div>
        {histLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
          </div>
        ) : loginHistory.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date & Time', 'Method', 'IP Address', 'Browser', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((entry) => (
                  <tr key={entry._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{formatDate(entry.timestamp)}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span className="badge badge-info">{entry.method === 'google' ? '🔷 Google' : '📧 Email'}</span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{entry.ipAddress || '—'}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.userAgent ? entry.userAgent.split(' ').slice(0, 3).join(' ') : '—'}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span className={`badge ${entry.success ? 'badge-success' : 'badge-danger'}`}>
                        {entry.success ? '✅ Success' : '❌ Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '1.5rem' }}>
            <div className="empty-icon">🔐</div>
            <p>No login history yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
