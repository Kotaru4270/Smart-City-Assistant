const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios  = require('axios');

let genAI;
const getGeminiAI = () => {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

// ─── Issue Classifier (AI + keyword fallback) ─────────────────────────────────
const CATEGORY_KEYWORDS = {
  Road:        ['road', 'pothole', 'street', 'highway', 'traffic', 'pavement', 'bridge', 'broken road'],
  Water:       ['water', 'pipe', 'leak', 'flood', 'drain', 'sewage', 'supply', 'tap'],
  Electricity: ['electricity', 'power', 'light', 'wire', 'outage', 'blackout', 'transformer'],
  Pollution:   ['garbage', 'waste', 'pollution', 'trash', 'smell', 'smoke', 'noise', 'dust'],
  Sanitation:  ['toilet', 'sanitation', 'cleaning', 'dirty', 'hygiene'],
};

const PRIORITY_KEYWORDS = {
  High:   ['urgent', 'dangerous', 'emergency', 'critical', 'accident', 'fire', 'unsafe', 'immediately'],
  Medium: ['problem', 'issue', 'broken', 'damaged', 'repair'],
  Low:    ['minor', 'small', 'suggestion', 'improve'],
};

const classifyByKeywords = (text) => {
  const lower = text.toLowerCase();
  let category = 'Other', priority = 'Medium', sentiment = 'Normal';

  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) { category = cat; break; }
  }

  if (PRIORITY_KEYWORDS.High.some((w) => lower.includes(w))) { priority = 'High'; sentiment = 'Urgent'; }
  else if (PRIORITY_KEYWORDS.Low.some((w) => lower.includes(w))) { priority = 'Low'; sentiment = 'Mild'; }

  return { category, priority, sentiment, confidence: 0.6, reasoning: 'Keyword-based classification' };
};

const analyzeIssueWithAI = async (title, description) => {
  const genai = getGeminiAI();
  if (!genai) return classifyByKeywords(`${title} ${description}`);

  try {
    const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are an AI assistant for a Smart City platform. Analyze the issue report and respond ONLY with a JSON object containing:
- category: one of [Road, Water, Electricity, Pollution, Sanitation, Other]
- priority: one of [High, Medium, Low]
- sentiment: one of [Urgent, Normal, Mild]
- confidence: number between 0 and 1
- reasoning: brief explanation (max 30 words)

Title: ${title}
Description: ${description}

Respond ONLY with valid JSON, no additional text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return classifyByKeywords(`${title} ${description}`);
  } catch (err) {
    console.error('Gemini classify error:', err.message);
    return classifyByKeywords(`${title} ${description}`);
  }
};

// ─── Smart Recommendations ────────────────────────────────────────────────────
const generateRecommendations = async ({ weather, aqi, places, preferences }) => {
  const genai = getGeminiAI();
  if (!genai) return generateRuleBasedRecommendations({ weather, aqi, places });

  try {
    const context = `
Weather: ${weather.description}, ${weather.temperature}°C, Humidity: ${weather.humidity}%
AQI: ${aqi.aqi} (${aqi.label}) - ${aqi.advice}
User interests: ${(preferences?.interests || []).join(', ') || 'general'}
Available places: ${places.slice(0, 10).map((p) => `${p.name} (rating: ${p.rating})`).join(', ')}
    `.trim();

    const model = genai.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `You are a smart city recommendation engine. Given weather, AQI, and places, return a JSON with:
- recommendations: array of { placeId, name, reason, score (0-10), bestTime }
- summary: brief overall advice
- avoid: any activities to avoid today

${context}

Respond ONLY with valid JSON, no additional text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return generateRuleBasedRecommendations({ weather, aqi, places });
  } catch (err) {
    return generateRuleBasedRecommendations({ weather, aqi, places });
  }
};

const generateRuleBasedRecommendations = ({ weather, aqi, places }) => {
  let summary = '', avoid = '';
  const aqiNum = aqi.aqi;

  if (aqiNum >= 4) {
    avoid = 'Avoid all outdoor activities due to very poor air quality.';
  } else if (aqiNum === 3) {
    avoid = 'Limit outdoor activities, especially for sensitive groups.';
  }

  const tempC = weather.temperature;
  if (tempC < 10) summary = 'Cold weather — prefer indoor attractions.';
  else if (tempC > 35) summary = 'Very hot — stay hydrated and prefer shaded/indoor places.';
  else if (weather.main === 'Rain') summary = 'Rainy day — consider indoor museums or malls.';
  else summary = 'Pleasant conditions for outdoor exploration!';

  const recommendations = places.slice(0, 6).map((p, i) => ({
    placeId:  p.placeId,
    name:     p.name,
    reason:   aqiNum <= 2 ? 'Good air quality for outdoor visits' : 'Indoor option recommended',
    score:    Math.max(0, p.rating * 1.8 - i * 0.2),
    bestTime: tempC > 30 ? 'Morning or Evening' : 'Anytime',
  }));

  return { recommendations, summary, avoid };
};

// ─── Predictive Alerts ────────────────────────────────────────────────────────
const generatePredictiveAlerts = (weather, aqi, forecast) => {
  const alerts = [];

  // AQI alerts
  if (aqi.aqi >= 4) {
    alerts.push({ type: 'danger', icon: '😷', title: 'Very Poor Air Quality', message: aqi.advice });
  } else if (aqi.aqi === 3) {
    alerts.push({ type: 'warning', icon: '⚠️', title: 'Moderate Pollution', message: aqi.advice });
  }

  // Rain prediction
  const rainySlots = (forecast || []).filter((f) => f.rainChance > 50);
  if (rainySlots.length) {
    alerts.push({ type: 'info', icon: '🌧️', title: 'Rain Expected', message: `Heavy rain likely around ${rainySlots[0].time}. Carry an umbrella!` });
  }

  // Temperature alerts
  if (weather.temperature > 40) {
    alerts.push({ type: 'danger', icon: '🌡️', title: 'Extreme Heat', message: 'Temperature above 40°C. Stay indoors and stay hydrated.' });
  } else if (weather.temperature < 5) {
    alerts.push({ type: 'warning', icon: '🥶', title: 'Cold Weather', message: 'Very cold conditions. Wear warm clothing.' });
  }

  // Wind alert
  if (weather.windSpeed > 15) {
    alerts.push({ type: 'warning', icon: '💨', title: 'High Winds', message: `Wind speed ${weather.windSpeed} m/s. Avoid outdoor events.` });
  }

  return alerts;
};

module.exports = { analyzeIssueWithAI, generateRecommendations, generateRuleBasedRecommendations, generatePredictiveAlerts };
