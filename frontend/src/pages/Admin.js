import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCity } from '../contexts/CityContext';
import { useAuth } from '../contexts/AuthContext';
import { issuesAPI, analyticsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const STAT_COLORS = {
  total: 'badge-primary',
  open: 'badge-danger',
  resolved: 'badge-success',
  closed: 'badge-info',
};

export default function Admin() {
  const { city } = useCity();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const loadAdminData = useCallback(async () => {
    if (user?.role !== 'admin') return;
    setLoading(true);
    try {
      const requestParams = { page, limit: 12, ...(city && { city }) };
      const [statRes, recentRes] = await Promise.allSettled([
        analyticsAPI.dashboard(city),
        issuesAPI.list(requestParams),
      ]);

      if (statRes.status === 'fulfilled') {
        setStats(statRes.value.data);
      }

      if (recentRes.status === 'fulfilled') {
        const issueData = recentRes.value.data;
        setRecent(Array.isArray(issueData) ? issueData : issueData?.issues || []);
        setTotal(issueData?.total || 0);
      }

      if (statRes.status === 'rejected' && recentRes.status === 'rejected') {
        throw new Error('Failed to load admin data');
      }
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [city, user, page]);

  useEffect(() => { loadAdminData(); }, [loadAdminData]);

  const updateStatus = async (issueId, status) => {
    try {
      const res = await issuesAPI.status(issueId, status);
      setRecent((prev) => prev.map((issue) => issue._id === issueId ? res.data.issue : issue));
      toast.success('Issue status updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to update status');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1>🛠️ Admin</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Admin access is required to view this page.</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🚫</div>
          <h3>Access denied</h3>
          <p>Only administrators can access the admin panel.</p>
          <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>🛠️ Admin Panel</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage reported issues and monitor city health at a glance.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card fade-up">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Issues</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{loading ? '…' : stats?.totalIssues ?? '—'}</div>
            </div>
            <span className={`badge ${STAT_COLORS.total}`}>Total</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total reported issues in {city || 'all cities'}.</div>
        </div>

        <div className="card fade-up fade-up-1">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Open Issues</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{loading ? '…' : stats?.openIssues ?? '—'}</div>
            </div>
            <span className={`badge ${STAT_COLORS.open}`}>Open</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Issues still awaiting action.</div>
        </div>

        <div className="card fade-up fade-up-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Resolved</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{loading ? '…' : stats?.resolvedIssues ?? '—'}</div>
            </div>
            <span className={`badge ${STAT_COLORS.resolved}`}>Resolved</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Issues closed successfully.</div>
        </div>
      </div>

      <div className="card fade-up" style={{ marginBottom: '1.5rem' }}>
        <div className="section-header">
          <div className="section-title">📊 Top Categories</div>
        </div>
        {stats?.categoryBreakdown?.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.75rem' }}>
            {stats.categoryBreakdown.map((item) => (
              <div key={item._id} style={{ padding: '0.85rem', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{item._id}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>{item.count}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>No category data available yet.</p>
          </div>
        )}
      </div>

      <div className="card fade-up">
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <div className="section-title">📝 All Reports</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{total} total issues {city ? `in ${city}` : 'in all cities'}</div>
        </div>
        {recent.length > 0 ? (
          <>
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              {recent.map((issue) => (
                <div key={issue._id} style={{ padding: '1rem', borderRadius: 16, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 700 }}>{issue.title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{issue.location?.city || 'No city specified'}</div>
                    </div>
                    <span className={`badge ${issue.status === 'Open' ? 'badge-danger' : issue.status === 'Resolved' ? 'badge-success' : 'badge-warning'}`}>{issue.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    <span className="badge badge-info">{issue.category}</span>
                    <span className={issue.priority === 'High' ? 'badge badge-danger' : issue.priority === 'Medium' ? 'badge badge-warning' : 'badge badge-success'}>{issue.priority}</span>
                  </div>
                  <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{issue.description?.slice(0, 140)}{issue.description?.length > 140 ? '…' : ''}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Reported by {issue.reportedBy?.name || 'Anonymous'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📅 {formatDate(issue.createdAt)}</div>
                  </div>
                  <div style={{ marginTop: '0.85rem' }}>
                    <label className="form-label">Update Status</label>
                    <select className="form-input form-select" value={issue.status} onChange={(e) => updateStatus(issue._id, e.target.value)}>
                      {['Open', 'In Progress', 'Resolved', 'Closed'].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem 0', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>← Previous</button>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[...Array(Math.ceil(total / 12))].map((_, i) => {
                  const pageNum = i + 1;
                  if (Math.abs(pageNum - page) <= 1 || pageNum === 1 || pageNum === Math.ceil(total / 12)) {
                    return (
                      <button key={pageNum} className={`btn btn-sm ${page === pageNum ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPage(pageNum)}>
                        {pageNum}
                      </button>
                    );
                  } else if (Math.abs(pageNum - page) === 2) {
                    return <span key={`ellipsis-${pageNum}`} style={{ padding: '0.4rem 0.2rem', color: 'var(--text-muted)' }}>…</span>;
                  }
                  return null;
                })}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 12)}>Next →</button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No reports found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
