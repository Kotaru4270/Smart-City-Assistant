# 🏙️ CityPulse — Smart City AI Assistant

A production-ready, full-stack Smart City platform powered by real-time APIs and AI.

---

## 🚀 Tech Stack

| Layer      | Technology |
|------------|-----------|
| Frontend   | React.js + Recharts + Framer Motion |
| Backend    | Node.js + Express + Socket.IO |
| Database   | MongoDB Atlas |
| AI         | OpenAI GPT-4o-mini |
| Weather    | OpenWeatherMap API |
| Places     | Google Maps / Places API |
| Storage    | AWS S3 |
| Auth       | JWT + Google OAuth 2.0 |

---

## 📁 Project Structure

```
smart-city/
├── backend/
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express route handlers
│   ├── controllers/    # Business logic (AI, notifications)
│   ├── middleware/     # Auth, passport
│   └── server.js       # Entry point
└── frontend/
    └── src/
        ├── components/ # Reusable UI (Layout, ChatBot)
        ├── contexts/   # AuthContext, CityContext
        ├── pages/      # Dashboard, Weather, Hospitals, Tourism, Issues, Analytics, Profile
        └── utils/      # API service layer
```

---

## ⚙️ Setup — Step by Step

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Copy and fill in your keys:

```bash
cd backend
cp .env.example .env
```

Required keys:
- `MONGODB_URI` — MongoDB Atlas connection string
- `OPENWEATHER_API_KEY` — [openweathermap.org](https://openweathermap.org/api)
- `GOOGLE_MAPS_API_KEY` — Google Cloud Console (enable: Maps JS, Places, Geocoding, Air Quality APIs)
- `OPENAI_API_KEY` — [platform.openai.com](https://platform.openai.com)
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET` — AWS Console
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth (optional)
- `JWT_SECRET` — any long random string

For the frontend, create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_KEY=your_google_maps_api_key
```

### 3. MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user
3. Whitelist your IP (or 0.0.0.0/0 for dev)
4. Copy the connection string into `MONGODB_URI`

### 4. AWS S3 Setup (for image uploads)

```bash
# Create S3 bucket
aws s3 mb s3://your-smart-city-bucket --region us-east-1

# Configure CORS on bucket (via AWS Console > Bucket > Permissions > CORS):
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT","POST","DELETE","GET"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### 5. Run Locally

```bash
# Terminal 1 — Backend
cd backend
npm run dev        # Runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm start          # Runs on http://localhost:3000
```

---

## 📡 API Reference

### Auth
| Method | Endpoint               | Description         |
|--------|------------------------|---------------------|
| POST   | /api/auth/register     | Register new user   |
| POST   | /api/auth/login        | Login               |
| GET    | /api/auth/me           | Get current user    |
| PUT    | /api/auth/preferences  | Update preferences  |
| GET    | /api/auth/login-history| Login history       |
| GET    | /api/auth/google       | Google OAuth        |

### Weather
| Method | Endpoint                | Description          |
|--------|-------------------------|----------------------|
| GET    | /api/weather/current?city= | Current weather   |
| GET    | /api/weather/forecast?city=| 5-day forecast    |
| GET    | /api/weather/hourly?city=  | 24h hourly        |

### AQI
| Method | Endpoint               | Description          |
|--------|------------------------|----------------------|
| GET    | /api/aqi/current?city= | Current AQI          |
| GET    | /api/aqi/forecast?city=| 24h AQI forecast     |

### Hospitals
| Method | Endpoint                       | Description     |
|--------|--------------------------------|-----------------|
| GET    | /api/hospitals/nearby?city=    | Nearby hospitals|
| GET    | /api/hospitals/details/:placeId| Place details   |

### Tourism
| Method | Endpoint                         | Description      |
|--------|----------------------------------|------------------|
| GET    | /api/tourism/nearby?city=&category=| Nearby places  |
| GET    | /api/tourism/search?query=&city= | Text search      |
| GET    | /api/tourism/autocomplete?input= | City autocomplete|

### Issues
| Method | Endpoint                 | Description       |
|--------|--------------------------|-------------------|
| POST   | /api/issues              | Report issue      |
| GET    | /api/issues?city=        | List issues       |
| GET    | /api/issues/:id          | Get single issue  |
| POST   | /api/issues/:id/upvote   | Upvote            |
| PUT    | /api/issues/:id/status   | Update status     |
| GET    | /api/issues/stats/summary| Issue stats       |

### AI
| Method | Endpoint                | Description           |
|--------|-------------------------|-----------------------|
| POST   | /api/ai/chat            | AI chatbot            |
| POST   | /api/ai/recommend       | Smart recommendations |
| GET    | /api/ai/alerts?city=    | Predictive alerts     |
| POST   | /api/ai/analyze-issue   | Classify issue        |

### Analytics
| Method | Endpoint                   | Description        |
|--------|----------------------------|--------------------|
| GET    | /api/analytics/dashboard   | City overview      |
| GET    | /api/analytics/user        | User activity      |
| GET    | /api/analytics/trends      | Trend analysis     |

---

## 🤖 AI Features

### 1. AI Chatbot (CityBot)
- Powered by GPT-4o-mini
- Injects live weather + AQI context
- Voice input via Web Speech API
- Maintains conversation history

### 2. Smart Recommendations
- Combines weather + AQI + Google Places
- Rule-based fallback when OpenAI unavailable
- Personalized by user interests

### 3. Predictive Alerts
- Rain probability from hourly forecast
- AQI health advisories
- Temperature extremes + wind warnings
- Broadcast to users via Socket.IO

### 4. Issue Classification
- Category (Road/Water/Electricity/Pollution/Sanitation)
- Priority (High/Medium/Low)
- Sentiment (Urgent/Normal/Mild)
- Keyword-based fallback, AI-enhanced if OpenAI key present

---

## 🚀 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build

# Install Vercel CLI
npm i -g vercel
vercel --prod

# Set environment variables in Vercel dashboard:
# REACT_APP_API_URL = https://your-backend.render.com/api
# REACT_APP_GOOGLE_MAPS_KEY = ...
```

### Backend → Render.com

1. Push code to GitHub
2. New Web Service → Connect repo
3. Root directory: `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add all env vars from `.env`

### Backend → AWS EC2

```bash
# On EC2 instance (Ubuntu 22.04)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone & install
git clone your-repo && cd smart-city/backend
npm install

# Install PM2 for process management
npm i -g pm2
pm2 start server.js --name smart-city-api
pm2 save && pm2 startup

# Nginx reverse proxy
sudo apt install nginx
# Configure /etc/nginx/sites-available/default to proxy to localhost:5000
```

---

## 🔒 Security Features

- JWT token authentication
- Bcrypt password hashing
- Rate limiting (200 req/15min)
- Helmet.js security headers
- CORS configured for production domains
- Input validation with express-validator
- S3 file type validation (images only)

---

## 📊 Database Schemas

- **User** — auth, preferences, search history, favorites
- **Issue** — title, description, category, priority, sentiment, AI analysis, images, upvotes
- **LoginHistory** — user, IP, userAgent, method, success, timestamp
- **Notification** — user, type, title, message, severity, read status

---

## 🛠️ Optional Enhancements

- [ ] Add Redis caching for weather/AQI responses
- [ ] Implement WebSocket for real-time issue notifications per city
- [ ] Add Google Maps embedded view in Hospitals/Tourism pages
- [ ] Implement email notifications via SendGrid
- [ ] Add admin dashboard for issue management
- [ ] Integrate Twilio for SMS emergency alerts
- [ ] Add image classification for uploaded issue photos (AWS Rekognition)
