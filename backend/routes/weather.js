const router = require('express').Router();
const axios  = require('axios');
const { optionalAuth } = require('../middleware/auth');

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';
const OWM_KEY  = () => process.env.OPENWEATHER_API_KEY;

// ─── Current Weather ──────────────────────────────────────────────────────────
router.get('/current', optionalAuth, async (req, res) => {
  const { city, lat, lon } = req.query;
  if (!city && (!lat || !lon)) {
    return res.status(400).json({ error: 'Provide city or lat/lon' });
  }

  try {
    const params = { appid: OWM_KEY(), units: 'metric' };
    if (city) params.q = city; else { params.lat = lat; params.lon = lon; }

    const { data } = await axios.get(`${OWM_BASE}/weather`, { params });

    // Track search if user logged in
    if (req.user && city) {
      req.user.addSearchHistory(city, 'city').catch(() => {});
    }

    res.json({
      city:        data.name,
      country:     data.sys.country,
      temperature: data.main.temp,
      feelsLike:   data.main.feels_like,
      humidity:    data.main.humidity,
      pressure:    data.main.pressure,
      visibility:  data.visibility,
      windSpeed:   data.wind.speed,
      windDeg:     data.wind.deg,
      description: data.weather[0].description,
      icon:        data.weather[0].icon,
      main:        data.weather[0].main,
      clouds:      data.clouds.all,
      sunrise:     data.sys.sunrise,
      sunset:      data.sys.sunset,
      coordinates: { lat: data.coord.lat, lon: data.coord.lon },
      timestamp:   data.dt,
    });
  } catch (err) {
    if (err.response?.status === 404) return res.status(404).json({ error: 'City not found' });
    res.status(500).json({ error: err.message });
  }
});

// ─── 5-Day Forecast ───────────────────────────────────────────────────────────
router.get('/forecast', optionalAuth, async (req, res) => {
  const { city, lat, lon } = req.query;
  if (!city && (!lat || !lon)) return res.status(400).json({ error: 'Provide city or lat/lon' });

  try {
    const params = { appid: OWM_KEY(), units: 'metric', cnt: 40 };
    if (city) params.q = city; else { params.lat = lat; params.lon = lon; }

    const { data } = await axios.get(`${OWM_BASE}/forecast`, { params });

    // Group by day
    const daily = {};
    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (!daily[date]) {
        daily[date] = {
          date,
          dt: item.dt,
          temps: [],
          humidity: [],
          windSpeed: [],
          descriptions: [],
          icons: [],
          rainChance: [],
        };
      }
      daily[date].temps.push(item.main.temp);
      daily[date].humidity.push(item.main.humidity);
      daily[date].windSpeed.push(item.wind.speed);
      daily[date].descriptions.push(item.weather[0].description);
      daily[date].icons.push(item.weather[0].icon);
      if (item.pop !== undefined) daily[date].rainChance.push(item.pop * 100);
    });

    const forecast = Object.values(daily).map((d) => ({
      date:        d.date,
      dt:          d.dt,
      tempMin:     Math.min(...d.temps).toFixed(1),
      tempMax:     Math.max(...d.temps).toFixed(1),
      tempAvg:     (d.temps.reduce((a, b) => a + b, 0) / d.temps.length).toFixed(1),
      humidity:    Math.round(d.humidity.reduce((a, b) => a + b, 0) / d.humidity.length),
      windSpeed:   (d.windSpeed.reduce((a, b) => a + b, 0) / d.windSpeed.length).toFixed(1),
      description: d.descriptions[0],
      icon:        d.icons[0],
      rainChance:  d.rainChance.length ? Math.round(Math.max(...d.rainChance)) : 0,
    }));

    res.json({ city: data.city.name, country: data.city.country, forecast });
  } catch (err) {
    if (err.response?.status === 404) return res.status(404).json({ error: 'City not found' });
    res.status(500).json({ error: err.message });
  }
});

// ─── Hourly (next 24h) ────────────────────────────────────────────────────────
router.get('/hourly', async (req, res) => {
  const { city, lat, lon } = req.query;
  try {
    const params = { appid: OWM_KEY(), units: 'metric', cnt: 8 };
    if (city) params.q = city; else { params.lat = lat; params.lon = lon; }
    const { data } = await axios.get(`${OWM_BASE}/forecast`, { params });
    const hourly = data.list.map((item) => ({
      time:        new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      dt:          item.dt,
      temp:        item.main.temp,
      humidity:    item.main.humidity,
      windSpeed:   item.wind.speed,
      description: item.weather[0].description,
      icon:        item.weather[0].icon,
      rainChance:  item.pop ? Math.round(item.pop * 100) : 0,
    }));
    res.json({ city: data.city.name, hourly });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
