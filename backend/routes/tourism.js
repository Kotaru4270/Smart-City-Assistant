const router = require('express').Router();
const axios  = require('axios');
const { optionalAuth } = require('../middleware/auth');

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';
const GKEY = () => process.env.GOOGLE_MAPS_API_KEY;

const geocodeCity = async (city) => {
  const { data } = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: { address: city, key: GKEY() },
  });
  if (data.status !== 'OK' || !data.results.length) throw new Error('City not found');
  const loc = data.results[0].geometry.location;
  return { lat: loc.lat, lon: loc.lng };
};

const PLACE_TYPES = {
  tourist:     'tourist_attraction',
  museum:      'museum',
  park:        'park',
  restaurant:  'restaurant',
  shopping:    'shopping_mall',
  nightlife:   'night_club',
  landmark:    'landmark',
};

// ─── Nearby Tourist Places ────────────────────────────────────────────────────
router.get('/nearby', optionalAuth, async (req, res) => {
  const { city, lat, lon, radius = 8000, category = 'tourist', keyword } = req.query;
  try {
    let coords;
    if (city) coords = await geocodeCity(city);
    else if (lat && lon) coords = { lat, lon };
    else return res.status(400).json({ error: 'Provide city or lat/lon' });

    const params = {
      location: `${coords.lat},${coords.lon}`,
      radius,
      type: PLACE_TYPES[category] || 'tourist_attraction',
      key: GKEY(),
    };
    if (keyword) params.keyword = keyword;

    const { data } = await axios.get(`${PLACES_BASE}/nearbysearch/json`, { params });

    if (data.status === 'REQUEST_DENIED') {
      return res.status(403).json({ error: 'Google Places API key invalid' });
    }

    const places = data.results.map((place) => ({
      placeId:      place.place_id,
      name:         place.name,
      address:      place.vicinity,
      rating:       place.rating || 0,
      totalRatings: place.user_ratings_total || 0,
      isOpen:       place.opening_hours?.open_now,
      types:        place.types,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      photo: place.photos?.[0]
        ? `${PLACES_BASE}/photo?maxwidth=600&photoreference=${place.photos[0].photo_reference}&key=${GKEY()}`
        : null,
      priceLevel: place.price_level,
    }));

    places.sort((a, b) => b.rating - a.rating);

    if (req.user && city) req.user.addSearchHistory(city, 'tourism').catch(() => {});

    res.json({ places, total: places.length, center: coords });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Text Search for Places ───────────────────────────────────────────────────
router.get('/search', optionalAuth, async (req, res) => {
  const { query, city } = req.query;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const params = { query: city ? `${query} in ${city}` : query, key: GKEY() };
    const { data } = await axios.get(`${PLACES_BASE}/textsearch/json`, { params });

    const places = data.results.slice(0, 15).map((place) => ({
      placeId:      place.place_id,
      name:         place.name,
      address:      place.formatted_address,
      rating:       place.rating || 0,
      totalRatings: place.user_ratings_total || 0,
      isOpen:       place.opening_hours?.open_now,
      types:        place.types,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      photo: place.photos?.[0]
        ? `${PLACES_BASE}/photo?maxwidth=600&photoreference=${place.photos[0].photo_reference}&key=${GKEY()}`
        : null,
    }));

    if (req.user) req.user.addSearchHistory(query, 'tourism').catch(() => {});
    res.json({ places, total: places.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Autocomplete ─────────────────────────────────────────────────────────────
router.get('/autocomplete', async (req, res) => {
  const { input, sessiontoken } = req.query;
  if (!input) return res.json({ predictions: [] });
  try {
    const { data } = await axios.get(`${PLACES_BASE}/autocomplete/json`, {
      params: { input, key: GKEY(), sessiontoken, types: '(cities)' },
    });
    res.json({ predictions: data.predictions || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
