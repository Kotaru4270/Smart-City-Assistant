import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useCity } from '../contexts/CityContext';
import { useAuth } from '../contexts/AuthContext';
import { weatherAPI, aqiAPI, issuesAPI, analyticsAPI, aiAPI } from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1','#22d3ee','#f43f5e','#34d399','#fbbf24','#8b5cf6'];

export default function Dashboard() {
  const { city } = useCity();
  const { user }  = useAuth();

  const [weather,   setWeather]   = useState(null);
  const [aqi,       setAqi]       = useState(null);
  const [stats,     setStats]     = useState(null);
  const [trend,     setTrend]     = useState([]);
  const [alerts,    setAlerts]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [recs,      setRecs]      = useState(null);

  const loadData = useCallback(async () => {
    if (!city) return;
    setLoading(true);
    try {
      const [wRes, aRes, sRes, tRes] = await Promise.allSettled([
        weatherAPI.current(city),
        aqiAPI.current(city),
        analyticsAPI.dashboard(city),
        analyticsAPI.trends({ city, days: 14 }),
      ]);

      if (wRes.status === 'fulfilled') setWeather(wRes.value.data);
      if (aRes.status === 'fulfilled') setAqi(aRes.value.data);
      if (sRes.status === 'fulfilled') setStats(sRes.value.data);
      if (tRes.status === 'fulfilled') setTrend(tRes.value.data.dailyVolume || []);

      try {
        const alertRes = await aiAPI.alerts(city);
        setAlerts(alertRes.data.alerts || []);
      } catch (_) {
        setAlerts([]);
      }
    } catch (err) {
      toast.error('Failed to load city data');
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadRecommendations = async () => {
    if (!city) return toast.error('Set a city first');
    setRecLoading(true);
    try {
      const res = await aiAPI.recommend({ city });
      setRecs(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Recommendation failed');
    } finally {
      setRecLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Issues',    value: stats?.totalIssues ?? '—',    icon: '📣', accent: 'accent', color: 'var(--accent)' },
    { label: 'Open Issues',     value: stats?.openIssues ?? '—',     icon: '🔴', accent: 'rose',   color: 'var(--accent3)' },
    { label: 'Resolved',        value: stats?.resolvedIssues ?? '—', icon: '✅', accent: 'emerald',color: 'var(--accent4)' },
    { label: 'Temperature',     value: weather ? `${weather.temperature}°C` : '—', icon: '🌡️', accent: 'cyan', color: 'var(--accent2)' },
  ];

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>
          {city ? `📍 ${city}` : 'Smart City Dashboard'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {city ? 'Real-time city intelligence at your fingertips' : 'Enter a city in the sidebar to get started'}
        </p>
      </div>

      {/* AI Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {alerts.map((a, i) => (
            <div key={i} className={`alert alert-${a.type}`}>
              <span>{a.icon}</span>
              <div><strong>{a.title}</strong> — {a.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid-4 fade-up" style={{ marginBottom: '1.75rem' }}>
        {statCards.map((s, i) => (
          <div key={i} className={`stat-card ${s.accent}`} style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color }}>{loading ? '…' : s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Weather Card */}
        <div className="card fade-up fade-up-1">
          <div className="section-header">
            <div className="section-title">🌤️ <span>Weather</span></div>
            <Link to="/weather" className="btn btn-ghost btn-sm">View More →</Link>
          </div>
          {weather ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt={weather.description} className="weather-icon" />
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{weather.temperature}°C</div>
                <div style={{ color: 'var(--text-secondary)', textTransform: 'capitalize', marginBottom: '0.5rem' }}>{weather.description}</div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>💧 {weather.humidity}%</span>
                  <span>💨 {weather.windSpeed} m/s</span>
                  <span>👁 {(weather.visibility / 1000).toFixed(1)}km</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <div className="empty-icon">🌤️</div>
              <p style={{ fontSize: '0.9rem' }}>{city ? 'Loading…' : 'Enter a city to see weather'}</p>
            </div>
          )}
        </div>

        {/* AQI Card */}
        <div className="card fade-up fade-up-2">
          <div className="section-header">
            <div className="section-title">🌿 <span>Air Quality</span></div>
            <Link to="/weather" className="btn btn-ghost btn-sm">View More →</Link>
          </div>
          {aqi ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: aqi.color }}>{aqi.aqi}</div>
                <div>
                  <div className={`badge badge-${['success','warning','warning','danger','danger'][aqi.aqi-1]}`} style={{ marginBottom: '0.4rem' }}>{aqi.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{aqi.advice}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                {[['PM2.5', aqi.components?.pm2_5], ['PM10', aqi.components?.pm10], ['O₃', aqi.components?.o3]].map(([k, v]) => (
                  <div key={k} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{k}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v?.toFixed(1) ?? '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <div className="empty-icon">🌿</div>
              <p style={{ fontSize: '0.9rem' }}>{city ? 'Loading…' : 'Enter a city to see AQI'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Issue Trend Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card fade-up fade-up-3">
          <div className="section-header">
            <div className="section-title">📈 <span>Issue Trend</span> (14 days)</div>
          </div>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} width={30} />
                <Tooltip contentStyle={{ background: 'rgba(10,18,40,0.95)', border: '1px solid rgba(99,130,255,0.3)', borderRadius: 8, color: '#f1f5f9' }} labelStyle={{ color: '#94a3b8' }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#trendGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 200 }}>
              <div className="empty-icon">📈</div>
              <p>{city ? 'No issues reported yet' : 'Enter a city to see trends'}</p>
            </div>
          )}
        </div>

        {/* Category Pie */}
        <div className="card fade-up fade-up-4">
          <div className="section-header">
            <div className="section-title">🥧 <span>Categories</span></div>
          </div>
          {stats?.categoryBreakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats.categoryBreakdown} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={75} label={({ _id, percent }) => `${_id} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {stats.categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(10,18,40,0.95)', border: '1px solid rgba(99,130,255,0.3)', borderRadius: 8, color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 200 }}>
              <div className="empty-icon">🥧</div>
              <p>No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="card fade-up">
        <div className="section-header">
          <div className="section-title">🤖 <span>AI Recommendations</span></div>
          <button className="btn btn-primary btn-sm" onClick={loadRecommendations} disabled={recLoading || !city}>
            {recLoading ? '…' : '✨ Get Recommendations'}
          </button>
        </div>

        {recs ? (
          <div>
            {recs.summary && <div className="alert alert-info" style={{ marginBottom: '1rem' }}>{recs.summary}</div>}
            {recs.avoid  && <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>⚠️ {recs.avoid}</div>}
            <div className="grid-3">
              {(recs.recommendations || []).slice(0, 6).map((r, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
                  {r.photo && <img src={r.photo} alt={r.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: '0.75rem' }} />}
                  <div style={{ fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.9rem' }}>{r.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{r.reason}</div>
                  {r.rating > 0 && <div className="stars">{'★'.repeat(Math.round(r.rating))}{'☆'.repeat(5 - Math.round(r.rating))} {r.rating}</div>}
                  {r.bestTime && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>⏰ Best: {r.bestTime}</div>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🤖</div>
            <p>Click "Get Recommendations" to see AI-powered suggestions based on current weather and AQI</p>
          </div>
        )}
      </div>
    </div>
  );
}
