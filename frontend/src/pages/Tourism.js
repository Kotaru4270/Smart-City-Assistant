import React, { useState, useCallback } from 'react';
import { useCity } from '../contexts/CityContext';
import { tourismAPI } from '../utils/api';
import toast from 'react-hot-toast';

const STAR = (r) => '★'.repeat(Math.round(r || 0)) + '☆'.repeat(5 - Math.round(r || 0));

const CATEGORIES = [
  { key: 'tourist',    label: '🗺️ Tourist',    icon: '🗺️' },
  { key: 'museum',     label: '🏛️ Museum',     icon: '🏛️' },
  { key: 'park',       label: '🌳 Park',        icon: '🌳' },
  { key: 'restaurant', label: '🍽️ Restaurant',  icon: '🍽️' },
  { key: 'shopping',   label: '🛍️ Shopping',   icon: '🛍️' },
  { key: 'nightlife',  label: '🎶 Nightlife',  icon: '🎶' },
];

export default function Tourism() {
  const { city } = useCity();
  const [places,     setPlaces]     = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);
  const [category,   setCategory]   = useState('tourist');
  const [searchCity, setSearchCity] = useState(city || '');
  const [keyword,    setKeyword]    = useState('');
  const [selected,   setSelected]   = useState(null);
  const [radius,     setRadius]     = useState(8000);

  const search = useCallback(async (overrideCity) => {
    const q = overrideCity || searchCity || city;
    if (!q) return toast.error('Enter a city');
    setLoading(true);
    setSearched(true);
    setSelected(null);
    try {
      let res;
      if (keyword.trim()) {
        res = await tourismAPI.search({ query: keyword, city: q });
      } else {
        res = await tourismAPI.nearby({ city: q, category, radius });
      }
      setPlaces(res.data.places || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Search failed');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [searchCity, city, category, radius, keyword]);

  const PriceLevel = ({ level }) => {
    if (!level) return null;
    return <span style={{ color: '#34d399', fontSize: '0.78rem' }}>{'$'.repeat(level)}</span>;
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1>🗺️ Tourism & Places</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Discover tourist attractions, restaurants, parks & more</p>
      </div>

      {/* Search Panel */}
      <div className="card fade-up" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label className="form-label">City</label>
            <input className="form-input" placeholder="e.g. Paris, Tokyo…" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Keyword (optional)</label>
            <input className="form-input" placeholder="e.g. Eiffel Tower…" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
          </div>
          <div style={{ minWidth: 140 }}>
            <label className="form-label">Radius</label>
            <select className="form-input form-select" value={radius} onChange={(e) => setRadius(+e.target.value)}>
              <option value={3000}>3 km</option>
              <option value={8000}>8 km</option>
              <option value={15000}>15 km</option>
              <option value={30000}>30 km</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => search()} disabled={loading} style={{ alignSelf: 'flex-end' }}>
            {loading ? '🔄 Searching…' : '🔍 Search'}
          </button>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={`btn btn-sm ${category === c.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setCategory(c.key); }}
            >{c.label}</button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      {searched && (
        <>
          {!loading && places.length > 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Found <strong style={{ color: 'var(--accent)' }}>{places.length}</strong> places
            </div>
          )}

          {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
              {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 16 }} />)}
            </div>
          ) : places.length > 0 ? (
            selected ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1rem', alignItems: 'start' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {places.map((p) => (
                  <div
                    key={p.placeId}
                    className="place-card"
                    style={{ cursor: 'pointer', border: selected?.placeId === p.placeId ? '1px solid var(--accent)' : '1px solid var(--border)' }}
                    onClick={() => setSelected(selected?.placeId === p.placeId ? null : p)}
                  >
                    {p.photo
                      ? <img src={p.photo} alt={p.name} className="place-card-img" loading="lazy" />
                      : <div className="place-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🗺️</div>
                    }
                    <div className="place-card-body">
                      <div className="place-card-name">{p.name}</div>
                      <div className="place-card-address" title={p.address}>📍 {p.address}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem' }}>
                        <div>
                          {p.rating > 0 && (
                            <>
                              <span className="stars">{STAR(p.rating)}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>{p.rating} ({p.totalRatings?.toLocaleString()})</span>
                            </>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <PriceLevel level={p.priceLevel} />
                          <span className={`badge ${p.isOpen ? 'badge-success' : p.isOpen === false ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.68rem' }}>
                            {p.isOpen ? 'Open' : p.isOpen === false ? 'Closed' : '?'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>

                {/* Side Detail */}
                <div className="card fade-up" style={{ position: 'sticky', top: 80 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{selected.name}</h3>
                    <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                  </div>
                  {selected.photo && <img src={selected.photo} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: '1rem' }} />}
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>📍 {selected.address}</div>
                  {selected.rating > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span className="stars">{STAR(selected.rating)}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>{selected.rating} · {selected.totalRatings} reviews</span>
                    </div>
                  )}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span className={`badge ${selected.isOpen ? 'badge-success' : selected.isOpen === false ? 'badge-danger' : 'badge-info'}`}>
                      {selected.isOpen ? '✅ Open Now' : selected.isOpen === false ? '❌ Closed' : '⏰ Hours unknown'}
                    </span>
                  </div>
                  {selected.types?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                      {selected.types.slice(0, 4).map((t) => (
                        <span key={t} className="badge badge-info" style={{ fontSize: '0.68rem' }}>{t.replace(/_/g,' ')}</span>
                      ))}
                    </div>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query_place_id=${selected.placeId}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}
                  >🗺️ Open in Google Maps</a>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {places.map((p) => (
                  <div
                    key={p.placeId}
                    className="place-card"
                    style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                    onClick={() => setSelected(p)}
                  >
                    {p.photo
                      ? <img src={p.photo} alt={p.name} className="place-card-img" loading="lazy" />
                      : <div className="place-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🗺️</div>
                    }
                    <div className="place-card-body">
                      <div className="place-card-name">{p.name}</div>
                      <div className="place-card-address" title={p.address}>📍 {p.address}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem' }}>
                        <div>
                          {p.rating > 0 && (
                            <>
                              <span className="stars">{STAR(p.rating)}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>{p.rating} ({p.totalRatings?.toLocaleString()})</span>
                            </>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <PriceLevel level={p.priceLevel} />
                          <span className={`badge ${p.isOpen ? 'badge-success' : p.isOpen === false ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.68rem' }}>
                            {p.isOpen ? 'Open' : p.isOpen === false ? 'Closed' : '?'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🗺️</div>
              <h3>No places found</h3>
              <p>Try a different category, city, or increase the search radius.</p>
            </div>
          )}
        </>
      )}

      {!searched && (
        <div className="empty-state" style={{ minHeight: '50vh' }}>
          <div className="empty-icon">🗺️</div>
          <h3>Explore Your City</h3>
          <p>Search any city to discover top-rated attractions, restaurants, parks, and more.</p>
          {city && <button className="btn btn-primary" onClick={() => { setSearchCity(city); search(city); }}>Explore {city}</button>}
        </div>
      )}
    </div>
  );
}
