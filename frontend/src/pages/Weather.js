import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useCity } from '../contexts/CityContext';
import { weatherAPI, aqiAPI } from '../utils/api';
import toast from 'react-hot-toast';

const TT = { background: 'rgba(10,18,40,0.95)', border: '1px solid rgba(99,130,255,0.3)', borderRadius: 8, color: '#f1f5f9' };

export default function Weather() {
  const { city } = useCity();
  const [current,  setCurrent]  = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourly,   setHourly]   = useState([]);
  const [aqi,      setAqi]      = useState(null);
  const [aqiFc,    setAqiFc]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [tab,      setTab]      = useState('weather');

  const load = useCallback(async () => {
    if (!city) return;
    setLoading(true);
    try {
      const [cR, fR, hR, aR, afR] = await Promise.allSettled([
        weatherAPI.current(city),
        weatherAPI.forecast(city),
        weatherAPI.hourly(city),
        aqiAPI.current(city),
        aqiAPI.forecast(city),
      ]);
      if (cR.status  === 'fulfilled') setCurrent(cR.value.data);
      if (fR.status  === 'fulfilled') setForecast(fR.value.data.forecast || []);
      if (hR.status  === 'fulfilled') setHourly(hR.value.data.hourly || []);
      if (aR.status  === 'fulfilled') setAqi(aR.value.data);
      if (afR.status === 'fulfilled') setAqiFc(afR.value.data.forecast || []);
    } catch { toast.error('Failed to load weather data'); }
    finally { setLoading(false); }
  }, [city]);

  useEffect(() => { load(); }, [load]);

  if (!city) return <div className="empty-state" style={{ marginTop: '4rem' }}><div className="empty-icon">🌍</div><p>Enter a city in the sidebar to see weather data</p></div>;
  if (loading) return <div className="empty-state" style={{ marginTop: '4rem' }}><div className="spinner" /><p style={{ color: 'var(--text-secondary)' }}>Loading…</p></div>;

  return (
    <div>
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div><h1>🌤️ Weather & AQI</h1><p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Live conditions for {city}</p></div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['weather','aqi'].map(t => (
            <button key={t} className={`btn ${tab===t?'btn-primary':'btn-ghost'} btn-sm`} onClick={()=>setTab(t)}>
              {t==='weather'?'🌤 Weather':'🌿 AQI'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'weather' ? (
        <>
          {current && (
            <div className="card fade-up" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1.5rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
                  <img src={`https://openweathermap.org/img/wn/${current.icon}@4x.png`} alt="" style={{ width:100, height:100 }} />
                  <div>
                    <div style={{ fontSize:'0.9rem', color:'var(--text-secondary)' }}>{current.city}, {current.country}</div>
                    <div style={{ fontSize:'4rem', fontWeight:800, fontFamily:'var(--font-display)', lineHeight:1 }}>{current.temperature}°C</div>
                    <div style={{ color:'var(--text-secondary)', textTransform:'capitalize' }}>{current.description}</div>
                    <div style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>Feels like {current.feelsLike}°C</div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem' }}>
                  {[
                    ['💧','Humidity',`${current.humidity}%`],
                    ['💨','Wind',`${current.windSpeed} m/s`],
                    ['🌡️','Pressure',`${current.pressure} hPa`],
                    ['👁','Visibility',`${(current.visibility/1000).toFixed(1)}km`],
                    ['🌅','Sunrise',new Date(current.sunrise*1000).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})],
                    ['🌇','Sunset',new Date(current.sunset*1000).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})],
                  ].map(([icon,label,val])=>(
                    <div key={label} style={{ textAlign:'center', background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'0.75rem' }}>
                      <div style={{ fontSize:'1.2rem' }}>{icon}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', margin:'0.2rem 0' }}>{label}</div>
                      <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hourly.length > 0 && (
            <div className="card fade-up fade-up-1" style={{ marginBottom:'1.25rem' }}>
              <div className="section-header"><div className="section-title">🕐 <span>Next 24 Hours</span></div></div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={hourly}>
                  <defs><linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient></defs>
                  <XAxis dataKey="time" tick={{ fill:'#64748b', fontSize:10 }} />
                  <YAxis tick={{ fill:'#64748b', fontSize:10 }} width={30} unit="°" />
                  <Tooltip contentStyle={TT} formatter={v=>[`${v}°C`,'Temp']} />
                  <Area type="monotone" dataKey="temp" stroke="#22d3ee" fill="url(#hGrad)" strokeWidth={2} dot={{ fill:'#22d3ee', r:3 }} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ marginTop:'0.75rem' }}>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'0.4rem' }}>Rain Probability</div>
                <ResponsiveContainer width="100%" height={55}>
                  <BarChart data={hourly}>
                    <XAxis dataKey="time" tick={{ fill:'#64748b', fontSize:9 }} />
                    <Tooltip contentStyle={TT} formatter={v=>[`${v}%`,'Rain']} />
                    <Bar dataKey="rainChance" fill="rgba(99,102,241,0.6)" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {forecast.length > 0 && (
            <>
              <div className="card fade-up fade-up-2" style={{ marginBottom:'1.25rem' }}>
                <div className="section-header"><div className="section-title">📅 <span>5-Day Forecast</span></div></div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'0.75rem' }}>
                  {forecast.slice(0,5).map((d,i)=>(
                    <div key={i} style={{ textAlign:'center', background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'1rem 0.5rem', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'0.4rem' }}>{d.date}</div>
                      <img src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`} alt="" style={{ width:48, height:48 }} />
                      <div style={{ fontWeight:700 }}>{d.tempMax}°</div>
                      <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{d.tempMin}°</div>
                      <div style={{ fontSize:'0.72rem', color:'#6366f1', marginTop:'0.3rem' }}>💧{d.rainChance}%</div>
                      <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:'0.2rem', textTransform:'capitalize' }}>{d.description}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card fade-up fade-up-3">
                <div className="section-header"><div className="section-title">🌡️ <span>Temperature Range Chart</span></div></div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={forecast.slice(0,5)}>
                    <XAxis dataKey="date" tick={{ fill:'#64748b', fontSize:10 }} />
                    <YAxis tick={{ fill:'#64748b', fontSize:10 }} width={35} unit="°" />
                    <Tooltip contentStyle={TT} />
                    <Line type="monotone" dataKey="tempMax" stroke="#f43f5e" strokeWidth={2} dot={{ fill:'#f43f5e', r:4 }} name="Max°C" />
                    <Line type="monotone" dataKey="tempMin" stroke="#22d3ee" strokeWidth={2} dot={{ fill:'#22d3ee', r:4 }} name="Min°C" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {aqi && (
            <div className="card fade-up" style={{ marginBottom:'1.25rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'2rem', flexWrap:'wrap' }}>
                <div style={{ textAlign:'center', minWidth:140 }}>
                  <div style={{ fontSize:'5rem', fontWeight:800, fontFamily:'var(--font-display)', color:aqi.color, lineHeight:1 }}>{aqi.aqi}</div>
                  <div style={{ fontSize:'1.1rem', fontWeight:700, color:aqi.color }}>{aqi.label}</div>
                  <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', maxWidth:220, margin:'0.5rem auto 0' }}>{aqi.advice}</div>
                </div>
                <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.75rem' }}>
                  {Object.entries(aqi.components||{}).map(([k,v])=>(
                    <div key={k} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'0.75rem', textAlign:'center' }}>
                      <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{k.replace('_','.')}</div>
                      <div style={{ fontWeight:700, fontSize:'1.1rem', marginTop:'0.2rem' }}>{typeof v==='number'?v.toFixed(1):v}</div>
                      <div style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>µg/m³</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {aqiFc.length > 0 && (
            <div className="card fade-up fade-up-1" style={{ marginBottom:'1.25rem' }}>
              <div className="section-header"><div className="section-title">📈 <span>AQI Forecast (24h)</span></div></div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={aqiFc}>
                  <defs><linearGradient id="aqiG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient></defs>
                  <XAxis dataKey="time" tick={{ fill:'#64748b', fontSize:10 }} />
                  <YAxis domain={[1,5]} tick={{ fill:'#64748b', fontSize:10 }} width={25} />
                  <Tooltip contentStyle={TT} formatter={(v,n)=>n==='aqi'?[['Good','Fair','Moderate','Poor','Very Poor'][v-1],'AQI']:[`${v} µg/m³`,'PM2.5']} />
                  <Area type="monotone" dataKey="aqi" stroke="#f43f5e" fill="url(#aqiG)" strokeWidth={2} name="aqi" />
                  <Line type="monotone" dataKey="pm2_5" stroke="#fbbf24" strokeWidth={1.5} dot={false} name="pm2_5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card fade-up fade-up-2">
            <div className="section-header"><div className="section-title">📊 <span>AQI Scale Reference</span></div></div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem' }}>
              {[['1','Good','#34d399','Safe for all'],['2','Fair','#fbbf24','Sensitive groups careful'],['3','Moderate','#f97316','Limit prolonged exertion'],['4','Poor','#ef4444','Avoid outdoor activities'],['5','Very Poor','#8b5cf6','Stay indoors']].map(([n,label,color,desc])=>(
                <div key={n} style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'1rem', borderTop:`3px solid ${color}` }}>
                  <div style={{ fontSize:'1.5rem', fontWeight:800, color }}>{n}</div>
                  <div style={{ fontWeight:700, margin:'0.25rem 0' }}>{label}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
