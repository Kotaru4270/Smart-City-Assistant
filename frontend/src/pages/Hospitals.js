import React, { useState, useCallback } from 'react';
import { useCity } from '../contexts/CityContext';
import { hospitalsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const STAR = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

export default function Hospitals() {
  const { city } = useCity();
  const [hospitals,  setHospitals]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);
  const [radius,     setRadius]     = useState(5000);
  const [filter,     setFilter]     = useState('');
  const [selected,   setSelected]   = useState(null);
  const [detLoading, setDetLoading] = useState(false);
  const [details,    setDetails]    = useState(null);
  const [searchCity, setSearchCity] = useState(city || '');

  const search = useCallback(async (overrideCity) => {
    const q = overrideCity || searchCity || city;
    if (!q) return toast.error('Enter a city');
    setLoading(true);
    setSearched(true);
    setSelected(null);
    setDetails(null);
    try {
      const res = await hospitalsAPI.nearby({ city: q, radius });
      setHospitals(res.data.hospitals || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Search failed');
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }, [searchCity, city, radius]);

  const openDetails = async (h) => {
    setSelected(h);
    setDetails(null);
    setDetLoading(true);
    try {
      const res = await hospitalsAPI.details(h.placeId);
      setDetails(res.data.details);
    } catch (_) {}
    finally { setDetLoading(false); }
  };

  const filtered = hospitals.filter((h) =>
    !filter || h.name.toLowerCase().includes(filter.toLowerCase()) || h.address.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1>🏥 Hospitals & Clinics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Find nearby medical facilities — real-time Google Places data</p>
      </div>

      {/* Search Controls */}
      <div className="card fade-up" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label className="form-label">City / Area</label>
            <input className="form-input" placeholder="e.g. Mumbai, New York…" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
          </div>
          <div style={{ minWidth: 160 }}>
            <label className="form-label">Radius</label>
            <select className="form-input form-select" value={radius} onChange={(e) => setRadius(+e.target.value)}>
              <option value={2000}>2 km</option>
              <option value={5000}>5 km</option>
              <option value={10000}>10 km</option>
              <option value={20000}>20 km</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => search()} disabled={loading} style={{ alignSelf: 'flex-end' }}>
            {loading ? '🔄 Searching…' : '🔍 Search Hospitals'}
          </button>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
          {/* List */}
          <div>
            {hospitals.length > 0 && (
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Found <strong style={{ color: 'var(--accent)' }}>{hospitals.length}</strong> facilities
                </div>
                <input className="form-input" placeholder="Filter results…" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 240, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} />
              </div>
            )}

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
              </div>
            ) : filtered.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {filtered.map((h) => (
                  <div
                    key={h.placeId}
                    className="place-card"
                    style={{ cursor: 'pointer', border: selected?.placeId === h.placeId ? '1px solid var(--accent)' : '1px solid var(--border)' }}
                    onClick={() => openDetails(h)}
                  >
                    {h.photo
                      ? <img src={h.photo} alt={h.name} className="place-card-img" />
                      : <div className="place-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🏥</div>
                    }
                    <div className="place-card-body">
                      <div className="place-card-name">{h.name}</div>
                      <div className="place-card-address" title={h.address}>📍 {h.address}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {h.rating > 0 ? (
                          <div>
                            <span className="stars">{STAR(h.rating)}</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>{h.rating} ({h.totalRatings})</span>
                          </div>
                        ) : <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No ratings</span>}
                        <span className={`badge ${h.isOpen ? 'badge-success' : h.isOpen === false ? 'badge-danger' : 'badge-info'}`}>
                          {h.isOpen ? 'Open' : h.isOpen === false ? 'Closed' : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🏥</div>
                <h3>No Results</h3>
                <p>No hospitals found {filter ? 'matching your filter' : 'in this area'}. Try increasing the radius.</p>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="card fade-up" style={{ position: 'sticky', top: '80px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)' }}>{selected.name}</h3>
                <button onClick={() => { setSelected(null); setDetails(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
              </div>
              {selected.photo && <img src={selected.photo} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, marginBottom: '1rem' }} />}

              {detLoading ? <div className="spinner" style={{ margin: '1rem auto' }} /> : details ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {details.formatted_address && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📍 {details.formatted_address}</div>}
                  {details.formatted_phone_number && <div style={{ fontSize: '0.85rem' }}>📞 <a href={`tel:${details.formatted_phone_number}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{details.formatted_phone_number}</a></div>}
                  {details.website && <div style={{ fontSize: '0.85rem' }}>🌐 <a href={details.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Visit Website</a></div>}
                  {details.rating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="stars">{STAR(details.rating)}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{details.rating} ({details.user_ratings_total} reviews)</span>
                    </div>
                  )}
                  {details.opening_hours?.weekday_text && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.75rem', marginTop: '0.25rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>🕐 Opening Hours</div>
                      {details.opening_hours.weekday_text.map((t, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.15rem 0' }}>{t}</div>
                      ))}
                    </div>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.name)}&query_place_id=${selected.placeId}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem', textAlign: 'center', justifyContent: 'center' }}
                  >
                    🗺️ Open in Google Maps
                  </a>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>📍 {selected.address}</div>
                  {selected.rating > 0 && <div style={{ marginTop: '0.5rem' }}><span className="stars">{STAR(selected.rating)}</span> {selected.rating}</div>}
                  <a href={`https://www.google.com/maps/search/?api=1&query_place_id=${selected.placeId}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: '1rem', display: 'inline-flex' }}>🗺️ View on Maps</a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="empty-state" style={{ minHeight: '50vh' }}>
          <div className="empty-icon">🏥</div>
          <h3>Find Nearby Hospitals</h3>
          <p>Search any city to discover hospitals and clinics with real-time ratings, hours, and contact info.</p>
          {city && <button className="btn btn-primary" onClick={() => { setSearchCity(city); search(city); }}>Search in {city}</button>}
        </div>
      )}
    </div>
  );
}
