const router = require('express').Router();
const axios  = require('axios');
const { optionalAuth } = require('../middleware/auth');

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';
const GKEY = () => process.env.GOOGLE_MAPS_API_KEY;

// Geocode city name to lat/lon
const geocodeCity = async (city) => {
  const { data } = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: { address: city, key: GKEY() },
  });
  if (data.status !== 'OK' || !data.results.length) throw new Error('City not found');
  const loc = data.results[0].geometry.location;
  return { lat: loc.lat, lon: loc.lng, formattedAddress: data.results[0].formatted_address };
};

// ─── Nearby Hospitals ─────────────────────────────────────────────────────────
router.get('/nearby', optionalAuth, async (req, res) => {
  const { city, lat, lon, radius = 5000, type = 'hospital' } = req.query;
  try {
    let coords;
    if (city) {
      const geo = await geocodeCity(city);
      coords = { lat: geo.lat, lon: geo.lon };
    } else if (lat && lon) {
      coords = { lat, lon };
    } else {
      return res.status(400).json({ error: 'Provide city or lat/lon' });
    }

    const { data } = await axios.get(`${PLACES_BASE}/nearbysearch/json`, {
      params: {
        location: `${coords.lat},${coords.lon}`,
        radius,
        type,
        keyword: 'hospital clinic medical',
        key: GKEY(),
      },
    });

    if (data.status === 'REQUEST_DENIED') {
      return res.status(403).json({ error: 'Google Places API key invalid or quota exceeded' });
    }

    const hospitals = data.results.map((place) => ({
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
        ? `${PLACES_BASE}/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GKEY()}`
        : null,
      distance: null, // Will be computed client-side or with Distance Matrix API
    }));

    // Sort by rating desc
    hospitals.sort((a, b) => (b.rating - a.rating) || (b.totalRatings - a.totalRatings));

    // Track search
    if (req.user && city) req.user.addSearchHistory(city, 'hospital').catch(() => {});

    res.json({ hospitals, total: hospitals.length, center: coords });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Hospital Details ─────────────────────────────────────────────────────────
router.get('/details/:placeId', async (req, res) => {
  try {
    const { data } = await axios.get(`${PLACES_BASE}/details/json`, {
      params: {
        place_id: req.params.placeId,
        fields: 'name,formatted_address,formatted_phone_number,rating,user_ratings_total,opening_hours,website,geometry,photos,reviews,types',
        key: GKEY(),
      },
    });
    if (data.status !== 'OK') return res.status(404).json({ error: 'Place not found' });
    res.json({ details: data.result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
