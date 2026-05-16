const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios  = require('axios');
const { protect, optionalAuth } = require('../middleware/auth');
const { generateRecommendations, generatePredictiveAlerts } = require('../controllers/aiController');

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

let genAI;
const getGeminiAI = () => {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const isRetryableModelError = (err) => {
  const message = (err?.message || '').toString().toLowerCase();
  const status = err?.response?.status || err?.status || null;
  return status === 429 || /rate limit|quota|limit|exceeded|too many requests|request limit/i.test(message);
};

const createGeminiChat = async (modelName, history, systemPrompt, message) => {
  const model = genAI.getGenerativeModel({ model: modelName });
  const chat = model.startChat({
    history,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    },
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
  });

  const result = await chat.sendMessage(message);
  return result.response.text();
};

const getChatReply = async (history, systemPrompt, message) => {
  let lastError;
  for (const modelName of MODELS) {
    try {
      return await createGeminiChat(modelName, history, systemPrompt, message);
    } catch (err) {
      if (!isRetryableModelError(err)) {
        throw err;
      }
      console.warn(`Gemini model ${modelName} failed, falling back to next model:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini models failed');
};

// ─── AI Chatbot ───────────────────────────────────────────────────────────────
router.post('/chat', optionalAuth, async (req, res) => {
  const { message, city, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const genai = getGeminiAI();
  if (!genai) return res.status(503).json({ error: 'AI service not configured' });

  try {
    // Fetch live context if city is provided
    let contextData = '';
    if (city) {
      try {
        const [weatherRes, aqiRes] = await Promise.allSettled([
          axios.get(`http://localhost:${process.env.PORT || 5000}/api/weather/current?city=${encodeURIComponent(city)}`),
          axios.get(`http://localhost:${process.env.PORT || 5000}/api/aqi/current?city=${encodeURIComponent(city)}`),
        ]);

        if (weatherRes.status === 'fulfilled') {
          const w = weatherRes.value.data;
          contextData += `\nCurrent weather in ${city}: ${w.temperature}°C, ${w.description}, Humidity: ${w.humidity}%, Wind: ${w.windSpeed} m/s.`;
        }
        if (aqiRes.status === 'fulfilled') {
          const a = aqiRes.value.data;
          contextData += `\nAQI in ${city}: ${a.aqi} (${a.label}). ${a.advice}`;
        }
      } catch (_) { /* context is optional */ }
    }

    const systemPrompt = `You are CityBot, an intelligent Smart City Assistant. Help users with:
- Weather information and advice
- Health & medical guidance (suggest nearby hospitals in emergencies)
- Tourist recommendations
- Air quality (AQI) health advice
- City issue reporting
- General city services

You are friendly, concise, and proactive. Always suggest actionable next steps.
If the user mentions an emergency, urgently suggest calling emergency services AND nearby hospitals.
${contextData ? `\nLive City Context:${contextData}` : ''}
${city ? `\nUser's current city: ${city}` : ''}`;

    // Convert history to Gemini format (must start with 'user' role)
    let geminiHistory = history
      .slice(-10)
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

    // Ensure history starts with 'user' role (Gemini requirement)
    // Skip any leading 'model' messages
    while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
      geminiHistory.shift();
    }

    const reply = await getChatReply(geminiHistory, systemPrompt, message);

    res.json({
      reply,
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
      },
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Smart Recommendations ────────────────────────────────────────────────────
router.post('/recommend', optionalAuth, async (req, res) => {
  const { city, category = 'tourist' } = req.body;
  if (!city) return res.status(400).json({ error: 'City is required' });

  try {
    const BASE = `http://localhost:${process.env.PORT || 5000}/api`;

    const [weatherRes, aqiRes, placesRes] = await Promise.allSettled([
      axios.get(`${BASE}/weather/current?city=${encodeURIComponent(city)}`),
      axios.get(`${BASE}/aqi/current?city=${encodeURIComponent(city)}`),
      axios.get(`${BASE}/tourism/nearby?city=${encodeURIComponent(city)}&category=${category}`),
    ]);

    const weather = weatherRes.status === 'fulfilled' ? weatherRes.value.data : null;
    const aqi     = aqiRes.status     === 'fulfilled' ? aqiRes.value.data     : null;
    const places  = placesRes.status  === 'fulfilled' ? placesRes.value.data.places : [];

    if (!weather || !aqi) {
      return res.status(422).json({ error: 'Could not fetch city data for recommendations' });
    }

    const result = await generateRecommendations({
      weather,
      aqi,
      places,
      preferences: req.user?.preferences,
    });

    // Enrich recommendations with full place data
    const enriched = result.recommendations?.map((rec) => {
      const place = places.find((p) => p.placeId === rec.placeId || p.name === rec.name);
      return { ...rec, ...place };
    });

    res.json({ ...result, recommendations: enriched, weather, aqi });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Predictive Alerts ────────────────────────────────────────────────────────
router.get('/alerts', async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ error: 'City is required' });

  try {
    const BASE = `http://localhost:${process.env.PORT || 5000}/api`;

    const [weatherRes, aqiRes, forecastRes] = await Promise.allSettled([
      axios.get(`${BASE}/weather/current?city=${encodeURIComponent(city)}`),
      axios.get(`${BASE}/aqi/current?city=${encodeURIComponent(city)}`),
      axios.get(`${BASE}/weather/hourly?city=${encodeURIComponent(city)}`),
    ]);

    const weather  = weatherRes.status  === 'fulfilled' ? weatherRes.value.data  : {};
    const aqi      = aqiRes.status      === 'fulfilled' ? aqiRes.value.data      : { aqi: 1 };
    const forecast = forecastRes.status === 'fulfilled' ? forecastRes.value.data.hourly : [];

    const alerts = generatePredictiveAlerts(weather, aqi, forecast);
    res.json({ alerts, city });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Analyze Issue (standalone) ───────────────────────────────────────────────
router.post('/analyze-issue', async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });

  const { analyzeIssueWithAI } = require('../controllers/aiController');
  try {
    const analysis = await analyzeIssueWithAI(title, description);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
