const router = require('express').Router();
const axios  = require('axios');

const OWM_KEY = () => process.env.OPENWEATHER_API_KEY;

// Resolve city → coords using OWM geocoding
const getCityCoords = async (city) => {
  const { data } = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
    params: { q: city, limit: 1, appid: OWM_KEY() },
  });
  if (!data.length) throw new Error('City not found');
  return { lat: data[0].lat, lon: data[0].lon, name: data[0].name, country: data[0].country };
};

const AQI_LABELS = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
const AQI_COLORS = ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#8f3f97'];
const AQI_ADVICE = [
  'Air quality is excellent. Perfect for outdoor activities!',
  'Air quality is acceptable. Sensitive groups should limit prolonged outdoor exertion.',
  'Members of sensitive groups may experience health effects. General public is less likely to be affected.',
  'Everyone may begin to experience health effects. Sensitive groups should avoid outdoor exertion.',
  'Health alert: everyone may experience serious health effects. Avoid all outdoor activities!',
];

// ─── Current AQI ─────────────────────────────────────────────────────────────
router.get('/current', async (req, res) => {
  const { city, lat, lon } = req.query;
  try {
    let coords, cityName;
    if (city) {
      const geo = await getCityCoords(city);
      coords = { lat: geo.lat, lon: geo.lon };
      cityName = `${geo.name}, ${geo.country}`;
    } else if (lat && lon) {
      coords = { lat, lon };
      cityName = 'Your Location';
    } else {
      return res.status(400).json({ error: 'Provide city or lat/lon' });
    }

    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/air_pollution', {
      params: { lat: coords.lat, lon: coords.lon, appid: OWM_KEY() },
    });

    const item  = data.list[0];
    const aqi   = item.main.aqi; // 1–5
    const comps = item.components;

    res.json({
      city:       cityName,
      aqi,
      label:      AQI_LABELS[aqi - 1],
      color:      AQI_COLORS[aqi - 1],
      advice:     AQI_ADVICE[aqi - 1],
      components: {
        co:    comps.co,
        no:    comps.no,
        no2:   comps.no2,
        o3:    comps.o3,
        so2:   comps.so2,
        pm2_5: comps.pm2_5,
        pm10:  comps.pm10,
        nh3:   comps.nh3,
      },
      timestamp: item.dt,
    });
  } catch (err) {
    if (err.message === 'City not found') return res.status(404).json({ error: 'City not found' });
    res.status(500).json({ error: err.message });
  }
});

// ─── AQI Forecast (next 24h) ─────────────────────────────────────────────────
router.get('/forecast', async (req, res) => {
  const { city, lat, lon } = req.query;
  try {
    let coords;
    if (city) {
      const geo = await getCityCoords(city);
      coords = { lat: geo.lat, lon: geo.lon };
    } else if (lat && lon) {
      coords = { lat, lon };
    } else {
      return res.status(400).json({ error: 'Provide city or lat/lon' });
    }

    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/air_pollution/forecast', {
      params: { lat: coords.lat, lon: coords.lon, appid: OWM_KEY() },
    });

    const forecast = data.list.slice(0, 24).map((item) => ({
      time:  new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      dt:    item.dt,
      aqi:   item.main.aqi,
      label: AQI_LABELS[item.main.aqi - 1],
      pm2_5: item.components.pm2_5,
      pm10:  item.components.pm10,
    }));

    res.json({ forecast });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
