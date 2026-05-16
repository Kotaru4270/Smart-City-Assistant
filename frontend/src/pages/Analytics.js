import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { useCity } from '../contexts/CityContext';
import { analyticsAPI, issuesAPI } from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1','#22d3ee','#f43f5e','#34d399','#fbbf24','#8b5cf6'];
const TT = { background: 'rgba(10,18,40,0.95)', border: '1px solid rgba(99,130,255,0.3)', borderRadius: 8, color: '#f1f5f9' };

export default function Analytics() {
  const { city } = useCity();
  const [dashboard, setDashboard] = useState(null);
  const [trends,    setTrends]    = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [days,      setDays]      = useState(30);
  const [loading,   setLoading]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, tRes, uRes] = await Promise.allSettled([
        analyticsAPI.dashboard(city),
        analyticsAPI.trends({ city, days }),
        analyticsAPI.user(),
      ]);
      if (dRes.status === 'fulfilled') setDashboard(dRes.value.data);
      if (tRes.status === 'fulfilled') setTrends(tRes.value.data);
      if (uRes.status === 'fulfilled') setUserStats(uRes.value.data);
    } catch (_) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [city, days]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div className="spinner" />
    </div>
  );

  const overviewCards = [
    { label: 'Total Issues',    value: dashboard?.totalIssues    ?? 0, icon: '📣', color: 'var(--accent)' },
    { label: 'Open',            value: dashboard?.openIssues     ?? 0, icon: '🔴', color: 'var(--accent3)' },
    { label: 'Resolved',        value: dashboard?.resolvedIssues ?? 0, icon: '✅', color: 'var(--accent4)' },
    { label: 'Resolution Rate', value: dashboard?.totalIssues ? `${Math.round((dashboard.resolvedIssues / dashboard.totalIssues) * 100)}%` : '0%', icon: '📊', color: 'var(--accent2)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>📊 Analytics & Trends</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{city ? `Data for ${city}` : 'All cities'} — real-time insights</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[7, 14, 30, 90].map((d) => (
            <button key={d} className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDays(d)}>{d}d</button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid-4 fade-up" style={{ marginBottom: '1.5rem' }}>
        {overviewCards.map((c, i) => (
          <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>{c.icon}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: c.color }}>{c.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Daily Volume Line Chart */}
      {trends?.dailyVolume?.length > 0 && (
        <div className="card fade-up fade-up-1" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title" style={{ marginBottom: '1.25rem' }}>📈 <span>Daily Issue Volume ({days} days)</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trends.dailyVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} width={30} allowDecimals={false} />
              <Tooltip contentStyle={TT} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 6 }} name="Issues" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category and Priority side-by-side */}
      <div className="grid-2 fade-up fade-up-2" style={{ marginBottom: '1.5rem' }}>
        {/* Category Bar */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: '1.25rem' }}>🏷️ <span>Issues by Category</span></div>
          {trends?.byCategory?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trends.byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis dataKey="_id" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Issues">
                  {trends.byCategory.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ height: 220 }}><p>No data</p></div>}
        </div>

        {/* Priority Pie */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: '1.25rem' }}>🎯 <span>Issues by Priority</span></div>
          {trends?.byPriority?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={trends.byPriority} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={85} label={({ _id, percent }) => `${_id} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {trends.byPriority.map((entry, i) => (
                    <Cell key={i} fill={entry._id === 'High' ? '#ef4444' : entry._id === 'Medium' ? '#fbbf24' : '#34d399'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TT} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ height: 220 }}><p>No data</p></div>}
        </div>
      </div>

      {/* Status Distribution + Top Cities */}
      <div className="grid-2 fade-up fade-up-3" style={{ marginBottom: '1.5rem' }}>
        {/* Status */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: '1.25rem' }}>📌 <span>Status Distribution</span></div>
          {trends?.byStatus?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {trends.byStatus.map((s, i) => {
                const total = trends.byStatus.reduce((a, b) => a + b.count, 0);
                const pct   = total ? Math.round((s.count / total) * 100) : 0;
                const color = { Open: '#ef4444', 'In Progress': '#fbbf24', Resolved: '#34d399', Closed: '#94a3b8' }[s._id] || '#6366f1';
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{s._id}</span>
                      <span style={{ fontWeight: 700 }}>{s.count} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="empty-state" style={{ height: 120 }}><p>No data</p></div>}
        </div>

        {/* Top Cities */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: '1.25rem' }}>🌆 <span>Most Active Cities</span></div>
          {dashboard?.topCities?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {dashboard.topCities.map((c, i) => {
                const max = dashboard.topCities[0].count;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{i+1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                        <span>{c._id || 'Unknown'}</span>
                        <span style={{ fontWeight: 700 }}>{c.count}</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                        <div style={{ width: `${(c.count / max) * 100}%`, height: '100%', background: COLORS[i], borderRadius: 99 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="empty-state" style={{ height: 120 }}><p>No data</p></div>}
        </div>
      </div>

      {/* User Activity */}
      {userStats && (
        <div className="card fade-up" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title" style={{ marginBottom: '1.25rem' }}>👤 <span>My Activity</span></div>
          <div className="grid-2">
            {/* My Issues */}
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>My Reported Issues</div>
              {userStats.myIssues?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {userStats.myIssues.map((issue) => (
                    <div key={issue._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                      <span style={{ flex: 1, fontSize: '0.83rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.title}</span>
                      <span className={`badge ${issue.status === 'Resolved' ? 'badge-success' : issue.status === 'Open' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.68rem', flexShrink: 0 }}>{issue.status}</span>
                    </div>
                  ))}
                </div>
              ) : <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No issues reported yet</div>}
            </div>

            {/* Search History */}
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>Recent Searches</div>
              {userStats.searchHistory?.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {userStats.searchHistory.map((s, i) => (
                    <span key={i} className="badge badge-info">{s.query}</span>
                  ))}
                </div>
              ) : <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No search history</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
