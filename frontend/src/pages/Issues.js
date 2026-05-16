import React, { useState, useEffect, useCallback } from 'react';
import { useCity } from '../contexts/CityContext';
import { useAuth } from '../contexts/AuthContext';
import { issuesAPI, aiAPI } from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Road','Water','Electricity','Pollution','Sanitation','Other'];
const STATUSES    = ['Open','In Progress','Resolved','Closed'];
const PRIORITIES  = ['High','Medium','Low'];

const PRIORITY_COLORS = { High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-success' };
const STATUS_COLORS   = { Open: 'badge-danger', 'In Progress': 'badge-warning', Resolved: 'badge-success', Closed: 'badge-info' };
const CAT_ICONS       = { Road: '🛣️', Water: '💧', Electricity: '⚡', Pollution: '🌫️', Sanitation: '🧹', Other: '📣' };

export default function Issues() {
  const { city }  = useCity();
  const { user }  = useAuth();
  const [view,    setView]    = useState('list'); // 'list' | 'report'
  const [issues,  setIssues]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [page,    setPage]    = useState(1);
  const [filters, setFilters] = useState({ category: '', priority: '', status: '' });
  const [selected, setSelected] = useState(null);

  // Report form
  const [form, setForm] = useState({ title: '', description: '', address: '', city: city || '' });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...(city && { city }), ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await issuesAPI.list(params);
      setIssues(res.data.issues || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [city, page, filters]);

  useEffect(() => { loadIssues(); }, [loadIssues]);

  // AI preview as user types
  useEffect(() => {
    if (!form.title || !form.description || form.description.length < 20) return;
    const t = setTimeout(async () => {
      setAnalyzing(true);
      try {
        const res = await aiAPI.analyzeIssue({ title: form.title, description: form.description });
        setAiPreview(res.data);
      } catch (_) {}
      finally { setAnalyzing(false); }
    }, 800);
    return () => clearTimeout(t);
  }, [form.title, form.description]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return toast.error('Title and description required');
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach((img) => fd.append('images', img));
      await issuesAPI.create(fd);
      toast.success('Issue reported successfully! 🎉');
      setForm({ title: '', description: '', address: '', city: city || '' });
      setImages([]); setPreviews([]); setAiPreview(null);
      setView('list');
      loadIssues();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (id) => {
    try {
      const res = await issuesAPI.upvote(id);
      setIssues((prev) => prev.map((i) => i._id === id ? { ...i, upvotes: Array(res.data.upvotes).fill(null) } : i));
    } catch (_) {}
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div>
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>📣 City Issues</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Report and track civic problems in real-time</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${view === 'list'   ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('list')}>📋 View Issues</button>
          <button className={`btn ${view === 'report' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('report')}>➕ Report Issue</button>
        </div>
      </div>

      {/* ─── REPORT FORM ─────────────────────────────────────────────────── */}
      {view === 'report' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', alignItems: 'start' }}>
          <div className="card fade-up">
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>📣 Report a New Issue</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Issue Title *</label>
                <input className="form-input" placeholder="Brief title of the problem" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-input" placeholder="Describe the issue in detail…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ minHeight: 120 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" placeholder="Street / landmark" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" placeholder="City name" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Attach Images (max 3)</label>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="form-input" style={{ cursor: 'pointer' }} />
                {previews.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {previews.map((src, i) => <img key={i} src={src} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />)}
                  </div>
                )}
              </div>
              <button className="btn btn-primary btn-lg" type="submit" disabled={submitting} style={{ width: '100%' }}>
                {submitting ? '📤 Submitting…' : '🚀 Submit Issue'}
              </button>
            </form>
          </div>

          {/* AI Analysis Preview */}
          <div className="card fade-up fade-up-1" style={{ position: 'sticky', top: 80 }}>
            <div className="section-title" style={{ marginBottom: '1rem' }}>🤖 <span>AI Analysis Preview</span></div>
            {analyzing && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Analyzing…</div>}
            {aiPreview && !analyzing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Category Detected</div>
                  <div style={{ fontSize: '1.1rem' }}>{CAT_ICONS[aiPreview.category]} <strong>{aiPreview.category}</strong></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Priority</div>
                    <span className={`badge ${PRIORITY_COLORS[aiPreview.priority]}`}>{aiPreview.priority}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Sentiment</div>
                    <span className="badge badge-info">{aiPreview.sentiment}</span>
                  </div>
                </div>
                {aiPreview.confidence && (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Confidence</div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${aiPreview.confidence * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{Math.round(aiPreview.confidence * 100)}%</div>
                  </div>
                )}
                {aiPreview.reasoning && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{aiPreview.reasoning}"</div>}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <div className="empty-icon" style={{ fontSize: '2rem' }}>🤖</div>
                <p style={{ fontSize: '0.85rem' }}>AI will analyze your issue description automatically</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ISSUES LIST ─────────────────────────────────────────────────── */}
      {view === 'list' && (
        <>
          {/* Filters */}
          <div className="card fade-up" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label className="form-label">Category</label>
                <select className="form-input form-select" value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label className="form-label">Priority</label>
                <select className="form-input form-select" value={filters.priority} onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}>
                  <option value="">All</option>
                  {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label className="form-label">Status</label>
                <select className="form-input form-select" value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ category: '', priority: '', status: '' }); setPage(1); }} style={{ alignSelf: 'flex-end' }}>Reset</button>
            </div>
          </div>

          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            {total} issues {city ? `in ${city}` : 'total'}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
            </div>
          ) : issues.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', alignItems: 'start' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {issues.map((issue) => (
                    <div
                      key={issue._id}
                      className="card"
                      style={{ cursor: 'pointer', border: selected?._id === issue._id ? '1px solid var(--accent)' : '1px solid var(--border)', padding: '1.25rem' }}
                      onClick={() => setSelected(selected?._id === issue._id ? null : issue)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', flex: 1 }}>{CAT_ICONS[issue.category]} {issue.title}</div>
                        <span className={`badge ${PRIORITY_COLORS[issue.priority]}`} style={{ flexShrink: 0 }}>{issue.priority}</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {issue.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span className="badge badge-info">{issue.category}</span>
                          <span className={`badge ${STATUS_COLORS[issue.status]}`}>{issue.status}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpvote(issue._id); }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}
                          >👍 {issue.upvotes?.length || 0}</button>
                          <span>📅 {formatDate(issue.createdAt)}</span>
                        </div>
                      </div>
                      {issue.location?.city && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>📍 {issue.location.city}</div>}
                    </div>
                  ))}
                </div>

                {/* Side Panel */}
                {selected && (
                  <div className="card fade-up" style={{ position: 'sticky', top: 80 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '1.1rem' }}>{CAT_ICONS[selected.category]} {selected.title}</div>
                      <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      <span className={`badge ${PRIORITY_COLORS[selected.priority]}`}>{selected.priority} Priority</span>
                      <span className={`badge ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                      <span className="badge badge-info">{selected.sentiment}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.7 }}>{selected.description}</p>
                    {selected.images?.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {selected.images.map((img, i) => <img key={i} src={img} alt="" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8 }} />)}
                      </div>
                    )}
                    {selected.aiAnalysis?.reasoning && (
                      <div className="alert alert-info" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                        🤖 {selected.aiAnalysis.reasoning}
                      </div>
                    )}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {selected.location?.address && <div>📍 {selected.location.address}{selected.location.city ? `, ${selected.location.city}` : ''}</div>}
                      <div>👤 Reported by {selected.reportedBy?.name || 'Anonymous'}</div>
                      <div>📅 {formatDate(selected.createdAt)}</div>
                      <div>👍 {selected.upvotes?.length || 0} upvotes</div>
                    </div>
                    {user?.role === 'admin' && (
                      <div style={{ marginTop: '1rem' }}>
                        <label className="form-label">Update Status</label>
                        <select className="form-input form-select" value={selected.status} onChange={async (e) => {
                          try {
                            const res = await issuesAPI.status(selected._id, e.target.value);
                            setSelected(res.data.issue);
                            setIssues((prev) => prev.map((i) => i._id === selected._id ? res.data.issue : i));
                            toast.success('Status updated');
                          } catch (_) { toast.error('Update failed'); }
                        }}>
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
                <span style={{ padding: '0.4rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Page {page} of {Math.ceil(total / 12)}</span>
                <button className="btn btn-ghost btn-sm" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(page + 1)}>Next →</button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📣</div>
              <h3>No issues found</h3>
              <p>{city ? `No issues reported in ${city} yet.` : 'No issues match your filters.'}</p>
              <button className="btn btn-primary" onClick={() => setView('report')}>Report an Issue</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
