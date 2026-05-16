# CityPulse — Smart City AI Assistant
## Comprehensive Project Report Generation Prompt

Use the following detailed prompt with any AI assistant (ChatGPT, Claude, Gemini, etc.) to generate a complete, publication-ready academic/project report. The report follows a 12-chapter software engineering documentation structure.

---

```markdown
Generate a comprehensive, professional academic project report for "CityPulse — Smart City AI Assistant" following the exact 12-chapter structure below. Use the technical details provided to ensure accuracy and depth. Format with proper headings, tables, diagrams (described in ASCII/text), and professional academic tone.

---

## COVER PAGE
Title: CityPulse — Smart City AI Assistant
Subtitle: A Full-Stack AI-Powered Urban Intelligence Platform
Project Type: Final Year Project / Technical Documentation
Tech Stack: React.js, Node.js, Express, MongoDB, OpenAI GPT-4o-mini, Socket.IO

---

## CHAPTER 1: INTRODUCTION (1.1–1.3)

### 1.1 Background & Motivation
- Urbanization is accelerating globally, creating challenges in traffic management, pollution monitoring, healthcare access, tourism navigation, and infrastructure maintenance.
- Citizens lack a unified platform to access real-time city information (weather, air quality, hospitals, tourist spots) and report civic issues.
- Existing solutions are fragmented: weather apps don't talk to hospital finders, issue reporting lacks AI classification, and there's no intelligent assistant to tie everything together.
- Motivation: Build a centralized, AI-powered Smart City platform that empowers citizens with information and participatory governance tools.

### 1.2 Objectives
Primary Objectives:
1. Provide real-time weather, Air Quality Index (AQI), and environmental monitoring with predictive alerts.
2. Enable location-based discovery of hospitals, tourist attractions, and city services via Google Maps/Places API.
3. Build a citizen issue reporting system with image uploads (AWS S3) and AI-powered classification.
4. Develop an AI chatbot (CityBot) using OpenAI GPT-4o-mini with voice input and live context injection.
5. Deliver personalized smart recommendations based on weather + AQI + user interests.
6. Create an analytics dashboard for city-wide trend analysis and visualization.
7. Implement secure authentication (JWT + Google OAuth 2.0) with role-based access.

### 1.3 Scope of Project
In Scope:
- Full-stack web application (React frontend, Node.js/Express backend).
- Real-time data integration: OpenWeatherMap, Google Places, OpenAI APIs.
- AI-powered issue classification into categories (Road/Water/Electricity/Pollution/Sanitation) with priority and sentiment.
- Real-time notifications via Socket.IO (weather alerts broadcast every 30 minutes via cron jobs).
- Image upload and storage via AWS S3 with file type validation.
- Responsive UI with Recharts for data visualization and Framer Motion for animations.
- Docker containerization support with docker-compose.

Out of Scope:
- Mobile native applications (iOS/Android).
- IoT sensor hardware integration.
- Government backend integration (actual municipal systems).
- SMS/Email notification gateways (Twilio/SendGrid — listed as future enhancements).

---

## CHAPTER 2: PROFILE OF THE PROBLEM (2.1–2.3)

### 2.1 Problem Statement
Modern urban residents face:
- Fragmented Information: Weather, AQI, hospital, and tourism data exist in separate apps.
- Delayed Issue Resolution: Civic complaints (potholes, water leaks) lack a centralized tracking and prioritization system.
- Lack of AI Assistance: No intelligent assistant to answer city-related queries contextually.
- Passive Citizenship: Citizens cannot easily participate in city improvement through reporting and upvoting.
- Environmental Blind Spots: No predictive alerting for dangerous weather or air quality events.

### 2.2 Rationale
Why this solution matters:
- Unified Dashboard: One platform for weather, AQI, hospitals, tourism, issues, and AI chat.
- AI-Driven Efficiency: Automatic issue classification reduces manual triage by city officials.
- Real-Time Engagement: Socket.IO enables instant alert broadcasting and live issue updates.
- Participatory Governance: Upvoting system ensures popular issues get attention.
- Accessibility: Voice input for the chatbot aids users with disabilities.

### 2.3 Scope of Study
- Focus on web-based delivery (React SPA).
- Target users: Urban citizens, tourists, city administrators.
- Geographic scope: Any city supported by OpenWeatherMap and Google Places APIs.
- Data scope: Real-time weather, AQI, nearby places, user-reported issues, AI-generated insights.

---

## CHAPTER 3: EXISTING SYSTEM (3.1–3.4)

### 3.1 Existing Platforms Comparison Table

| Platform | Weather | AQI | Hospitals | Tourism | Issue Reporting | AI Chatbot | Analytics | Auth |
|----------|---------|-----|-----------|---------|-----------------|------------|-----------|------|
| Weather.com | Yes | No | No | No | No | No | No | No |
| AccuWeather | Yes | Limited | No | No | No | No | No | No |
| Google Maps | No | No | Yes | Yes | No | No | No | OAuth |
| FixMyStreet | No | No | No | No | Yes | No | Basic | Email |
| CityPulse (Proposed) | Yes | Yes | Yes | Yes | Yes | Yes | Yes | JWT + OAuth |

### 3.2 DFD for Present Informal System
Describe the current fragmented flow:
- User opens multiple apps (weather app → maps app → municipal website).
- No data sharing between services.
- Issue reporting is manual, often via phone/email with no tracking.
- No AI assistance for queries or recommendations.
- Include Context Diagram (Level 0) and Level 1 DFD descriptions.

### 3.3 What's New in Proposed System
1. Unified Architecture: Single platform consolidating 6+ services.
2. AI Integration: GPT-4o-mini for chatbot, recommendations, issue classification, and alert generation.
3. Real-Time Layer: Socket.IO for live notifications and city-specific room subscriptions.
4. Smart Classifications: AI categorizes and prioritizes citizen issues automatically.
5. Predictive Alerts: Cron-scheduled weather alert broadcasting every 30 minutes.
6. Cloud Storage: AWS S3 for secure image uploads with type validation.
7. Modern UI/UX: React with lazy loading, Framer Motion animations, Recharts visualizations.

---

## CHAPTER 4: PROBLEM ANALYSIS (4.1–4.3)

### 4.1 Product Definition

#### Functional Requirements:
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | User registration and login (email/password + Google OAuth) | High |
| FR-02 | JWT-based session management with protected routes | High |
| FR-03 | Real-time weather display (current, forecast, hourly) | High |
| FR-04 | AQI monitoring with health advisories | High |
| FR-05 | Nearby hospital search with Google Places | High |
| FR-06 | Tourism discovery with category filters and autocomplete | High |
| FR-07 | Issue reporting with title, description, location, images | High |
| FR-08 | AI-powered issue classification (category, priority, sentiment) | High |
| FR-09 | Issue upvoting system | Medium |
| FR-10 | Issue status tracking (Pending → In Progress → Resolved) | Medium |
| FR-11 | AI chatbot with voice input and conversation history | High |
| FR-12 | Smart recommendations based on weather + AQI + interests | Medium |
| FR-13 | Predictive weather/AQI alerts via Socket.IO | Medium |
| FR-14 | Analytics dashboard with trend visualizations | Medium |
| FR-15 | User preference management (city, interests, notifications) | Low |

#### Technical Requirements:
- Frontend: React 18, React Router v6, Axios, Recharts, Framer Motion, Socket.IO Client.
- Backend: Node.js 20, Express 4, Mongoose ODM, Socket.IO Server.
- Database: MongoDB Atlas (cloud) / MongoDB 7 (Docker).
- External APIs: OpenWeatherMap, Google Maps/Places/Geocoding, OpenAI GPT-4o-mini.
- Storage: AWS S3 with Multer middleware.
- Security: Helmet.js, CORS, express-rate-limit (200 req/15min), express-validator.
- DevOps: Docker, Docker Compose, PM2 (production).

#### Quality Requirements:
- Performance: Page load < 2s, API response < 500ms.
- Availability: 99% uptime target.
- Security: OWASP Top 10 compliance, JWT expiration, bcrypt hashing.
- Scalability: Stateless backend, horizontal scaling ready.
- Usability: Responsive design, voice input, toast notifications.

### 4.2 Feasibility Analysis

#### Technical Feasibility:
- All technologies are mature and well-documented (React, Express, MongoDB).
- APIs are commercially available with free tiers (OpenWeatherMap, Google Cloud).
- OpenAI GPT-4o-mini is cost-effective for chatbot and classification tasks.
- Docker ensures environment consistency.

#### Economic Feasibility:
- Development: Open-source stack (zero licensing costs).
- APIs: Free tiers sufficient for development and demo.
- Hosting: Vercel (frontend free tier) + Render/AWS EC2 (backend) + MongoDB Atlas (free tier).
- AWS S3: Pay-per-use storage, minimal cost for demo.

#### Operational Feasibility:
- Web-based: No installation required for users.
- Intuitive UI: Modern React interface with clear navigation.
- Maintenance: Modular code structure allows independent updates.

#### Schedule Feasibility:
- Phase 1 (Weeks 1-2): Project setup, database design, auth system.
- Phase 2 (Weeks 3-4): Weather, AQI, hospitals, tourism APIs.
- Phase 3 (Weeks 5-6): Issue reporting, S3 uploads, AI classification.
- Phase 4 (Weeks 7-8): AI chatbot, recommendations, alerts.
- Phase 5 (Weeks 9-10): Analytics, testing, UI polish, deployment.

### 4.3 Project Plan Table

| Phase | Task | Duration | Deliverable |
|-------|------|----------|-------------|
| 1 | Requirements & Design | 2 weeks | SRS, ER Diagram, Architecture |
| 2 | Backend Core & Auth | 2 weeks | Auth API, JWT, MongoDB schemas |
| 3 | External API Integration | 2 weeks | Weather, AQI, Hospitals, Tourism |
| 4 | Issue System & AI | 2 weeks | Issue reporting, S3, AI classification |
| 5 | AI Features & Chat | 2 weeks | Chatbot, recommendations, alerts |
| 6 | Frontend & Dashboard | 2 weeks | React UI, Analytics, Responsive |
| 7 | Testing & Deployment | 2 weeks | Test cases, Docker, Vercel/Render deploy |

---

## CHAPTER 5: SOFTWARE REQUIREMENT ANALYSIS (5.1–5.3)

### 5.1 SRS Introduction
- Purpose: Define complete requirements for CityPulse Smart City platform.
- Intended Audience: Developers, testers, project supervisors, stakeholders.
- Scope: Full-stack web application with AI integration.
- Definitions: JWT, AQI, OAuth, SPA, REST API, WebSocket, Cron.

### 5.2 General Description
- Product Perspective: Independent web platform consuming third-party APIs.
- User Classes: Citizens (report issues, chat, explore), Tourists (discover places), Admins (view analytics, manage issues).
- Operating Environment: Modern browsers (Chrome, Firefox, Safari, Edge), Node.js 20+ runtime.
- Constraints: API rate limits, AWS S3 costs, OpenAI token costs.
- Dependencies: External APIs (OpenWeatherMap, Google, OpenAI), MongoDB Atlas connectivity.

### 5.3 Specific Requirements

#### Functional Requirements (Detailed):

**Auth Module:**
- User registers with name, email, password (min 6 chars, validated).
- User logs in with email/password; JWT token returned (expires in 7 days).
- Google OAuth 2.0 login with profile and email scopes.
- Login history tracked (IP, user-agent, method, timestamp, success/failure).
- Preferences: preferred city, interests, notification settings.

**Weather Module:**
- Current weather by city name (temperature, humidity, wind, conditions).
- 5-day forecast with daily summaries.
- 24-hour hourly forecast data.

**AQI Module:**
- Current AQI with pollutant breakdown (PM2.5, PM10, O3, NO2, SO2, CO).
- 24-hour AQI forecast with health advisories.

**Hospitals Module:**
- Nearby hospitals by city with ratings, distance, and contact info.
- Detailed place view using Google Place ID.

**Tourism Module:**
- Nearby attractions filtered by category (restaurants, parks, museums, etc.).
- Text search within city context.
- City autocomplete for search assistance.

**Issues Module:**
- Report issue with title, description, address, city, coordinates.
- Upload up to 3 images (5MB max each, images only) to AWS S3.
- AI auto-classification: category (Road/Water/Electricity/Pollution/Sanitation), priority (High/Medium/Low), sentiment (Urgent/Normal/Mild).
- Browse issues with filters (city, category, priority, status) and pagination.
- Upvote/downvote issues.
- Status updates: Pending → In Progress → Resolved (with resolved timestamp).
- Issue analytics: category distribution, status breakdown, priority stats, 30-day trend.
- Real-time broadcast of new issues to city-specific Socket.IO rooms.

**AI Module:**
- Chatbot: Context-aware conversations injecting live weather and AQI data.
- Voice input via Web Speech API.
- Recommendations: Personalized suggestions combining weather + AQI + interests.
- Alerts: Predictive weather/AQI alerts broadcast via Socket.IO every 30 minutes (cron job).
- Issue Analysis: AI-powered classification with keyword-based fallback.

**Analytics Module:**
- Dashboard overview: aggregated city metrics.
- User activity tracking.
- Trend analysis over time.

#### Non-Functional Requirements:

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-01 | Performance | API responses < 500ms; frontend renders < 2s |
| NFR-02 | Security | JWT auth, bcrypt hashing, rate limiting, Helmet headers, CORS, input validation |
| NFR-03 | Reliability | 99% uptime; graceful API fallbacks (rule-based when OpenAI unavailable) |
| NFR-04 | Scalability | Stateless backend; Socket.IO rooms for city-based segmentation |
| NFR-05 | Usability | Responsive design, toast notifications, loading states, error boundaries |
| NFR-06 | Maintainability | Modular MVC structure, environment-based configuration |
| NFR-07 | Portability | Docker containers; runs on any Docker-enabled host |

---

## CHAPTER 6: DESIGN (6.1–6.5)

### 6.1 System Design & Architecture Diagram

Describe the 3-tier architecture:

**Presentation Tier (Frontend):**
- React 18 SPA with React Router v6.
- Lazy-loaded pages for code splitting.
- Context API for global state (AuthContext, CityContext).
- Axios for API calls; Socket.IO client for real-time updates.
- Recharts for charts; Framer Motion for animations.

**Application Tier (Backend):**
- Express.js REST API server.
- Modular route structure: /api/auth, /api/weather, /api/aqi, /api/hospitals, /api/tourism, /api/issues, /api/ai, /api/analytics, /api/notifications.
- Middleware stack: Helmet, CORS, JSON parser, Morgan logging, Rate Limiter, Passport initialization.
- Socket.IO server for real-time bidirectional communication.
- Cron jobs for scheduled alert broadcasting.

**Data Tier:**
- MongoDB Atlas (production) / MongoDB Docker (development).
- Mongoose schemas: User, Issue, LoginHistory, Notification.
- AWS S3 for unstructured image data.

**External Services:**
- OpenWeatherMap API → Weather & AQI data.
- Google Maps/Places API → Location & place data.
- OpenAI API → GPT-4o-mini for AI features.

Include ASCII/text-based architecture diagram:
```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
│  React 18 | React Router | Axios | Socket.IO-Client         │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / WebSocket
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     LOAD BALANCER                            │
│                    (Nginx / Vercel)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND SERVER                             │
│  Express.js | Node.js 20 | Socket.IO Server | Cron Jobs     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  Auth   │ │ Weather │ │ Issues  │ │   AI    │          │
│  │ Routes  │ │ Routes  │ │ Routes  │ │ Routes  │          │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘          │
│       └─────────────┴───────────┴───────────┘               │
│                         │                                   │
│              ┌──────────┴──────────┐                        │
│              │    Middleware       │                        │
│              │ Helmet|CORS|RateLim │                        │
│              └──────────┬──────────┘                        │
└─────────────────────────┼───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌──────────┐    ┌──────────┐    ┌──────────────────┐
   │ MongoDB  │    │  AWS S3  │    │  External APIs   │
   │  Atlas   │    │  Images  │    │ OpenWeatherMap   │
   │          │    │          │    │ Google Places    │
   │ User     │    │          │    │ OpenAI GPT-4o    │
   │ Issue    │    │          │    │                  │
   │ History  │    │          │    │                  │
   └──────────┘    └──────────┘    └──────────────────┘
```

### 6.2 ER Diagram & Use Case Diagram

**ER Diagram Description:**
- USER (1) ---reports--- (N) ISSUE
- USER (1) ---has--- (N) LOGINHISTORY
- USER (1) ---receives--- (N) NOTIFICATION
- ISSUE has embedded location (address, city, coordinates) and images array.

Entities and Attributes:
- USER: _id, name, email, password (hashed), avatar, role, googleId, preferences {preferredCity, interests[], notifications}, lastLogin, timestamps.
- ISSUE: _id, title, description, category, priority, sentiment, aiAnalysis {}, location {address, city, coordinates {lat, lng}}, images[], reportedBy (ref: USER), upvotes[] (ref: USER), status, resolvedAt, timestamps.
- LOGINHISTORY: _id, user (ref: USER), ipAddress, userAgent, method, success, timestamp.
- NOTIFICATION: _id, user (ref: USER), type, title, message, severity, read, timestamps.

**Use Case Diagram (Actors & Actions):**
Actors: Citizen, Tourist, Administrator, System (Cron/AI).

Citizen Use Cases:
- Register/Login (email or Google OAuth)
- View Weather & AQI
- Search Hospitals & Tourism
- Report Issue (with images)
- Upvote Issues
- Chat with CityBot (text + voice)
- View Recommendations
- Update Preferences

Tourist Use Cases:
- Search nearby attractions
- View city weather/AQI
- Use chatbot for city queries

Administrator Use Cases:
- View Analytics Dashboard
- Update Issue Status
- View Login History

System Use Cases:
- AI Classify Issue
- Broadcast Weather Alerts (cron)
- Send Real-time Notifications (Socket.IO)

### 6.3 Detailed Class/Component Design

**Backend Components:**

| Component | Responsibility |
|-----------|---------------|
| AuthController | Register, login, OAuth, token generation, preference updates, login history |
| WeatherController | Fetch current/forecast/hourly from OpenWeatherMap |
| AQIController | Fetch AQI current and forecast |
| HospitalController | Nearby search, place details via Google Places |
| TourismController | Nearby places, text search, autocomplete |
| IssueController | CRUD issues, upvoting, status updates, analytics aggregation |
| AIController | Chat completion, recommendations, alert generation, issue analysis |
| AnalyticsController | Dashboard metrics, user activity, trend analysis |
| NotificationController | Socket.IO broadcast, cron alert scheduling |

**Frontend Components:**

| Component | Responsibility |
|-----------|---------------|
| App | Router setup, providers, lazy loading |
| Layout | Navigation sidebar, header, content area |
| AuthContext | Authentication state, login/logout, token management |
| CityContext | Selected city state, shared across pages |
| Dashboard | Weather cards, AQI indicator, quick stats |
| Weather | Detailed weather display with charts |
| Hospitals | Map view, hospital list, details |
| Tourism | Category filters, place cards, search |
| Issues | Issue list, report form, filters, upvoting |
| Analytics | Recharts visualizations, trend graphs |
| Profile | User info, preferences, login history |
| ChatBot | Floating chat widget, voice input, message history |

### 6.4 Flowcharts

**6.4.1 Registration Flowchart:**
```
Start → Enter Name/Email/Password → Validate Input (express-validator)
  → Check Email Exists? → Yes → Error "Email registered"
  → No → Hash Password (bcrypt) → Create User → Record Login History
  → Generate JWT → Return Token + User → End
```

**6.4.2 Issue Search & Filter Flowchart:**
```
Start → User opens Issues page → Optional Auth Check
  → Enter Filters (city, category, priority, status)
  → Build MongoDB Query Filter → Count Total Documents
  → Apply Pagination (skip, limit) → Sort by createdAt desc
  → Populate reportedBy field → Return JSON {issues, total, page, pages}
  → Render Issue Cards → End
```

**6.4.3 AI Issue Classification Flowchart:**
```
Start → User submits issue (title + description)
  → Call analyzeIssueWithAI(title, description)
  → OpenAI API Available? → Yes → GPT classifies category/priority/sentiment
  → No → Keyword-based Fallback (search title/description for keywords)
  → Return AI Analysis Object → Store in Issue document
  → Broadcast to city room via Socket.IO → End
```

### 6.5 Pseudo Code

**6.5.1 JWT Authentication Filter (Middleware):**
```
FUNCTION protect(request, response, next):
  token ← Extract from Authorization header (Bearer token)
  IF token is missing:
    RETURN response.status(401).json({ error: "Not authorized" })
  
  TRY:
    decoded ← jwt.verify(token, JWT_SECRET)
    user ← User.findById(decoded.id)
    IF user is null:
      RETURN response.status(401).json({ error: "User not found" })
    request.user ← user
    CALL next()
  CATCH error:
    RETURN response.status(401).json({ error: "Invalid token" })
END FUNCTION
```

**6.5.2 AI-Powered Issue Classification with Conflict Detection (Fallback):**
```
FUNCTION analyzeIssueWithAI(title, description):
  combinedText ← title + " " + description
  
  // Define keyword mappings for fallback
  keywords ← {
    "Road": ["pothole", "road", "street", "traffic", "signal"],
    "Water": ["water", "leak", "pipeline", "flood", "drainage"],
    "Electricity": ["power", "electric", " outage", "wire", "transformer"],
    "Pollution": ["pollution", "smoke", "garbage", "waste", "toxic"],
    "Sanitation": ["sewage", "toilet", "clean", "hygiene", "trash"]
  }
  
  TRY:
    // Attempt OpenAI classification
    prompt ← "Classify this civic issue. Return JSON with: category (Road/Water/Electricity/Pollution/Sanitation), priority (High/Medium/Low), sentiment (Urgent/Normal/Mild). Issue: " + combinedText
    response ← openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{role: "user", content: prompt}] })
    result ← JSON.parse(response.choices[0].message.content)
    RETURN result
  CATCH openAIError:
    // Fallback: keyword-based classification
    categoryScores ← empty map
    FOR each category, wordList IN keywords:
      score ← count matching words in combinedText
      categoryScores[category] ← score
    
    bestCategory ← category with max score, default "Road"
    
    // Determine priority based on urgency words
    IF combinedText contains "urgent", "dangerous", "broken", "leaking":
      priority ← "High"
    ELSE IF combinedText contains "needed", "repair", "fix":
      priority ← "Medium"
    ELSE:
      priority ← "Low"
    
    // Determine sentiment
    IF combinedText contains "urgent", "emergency", "hazard":
      sentiment ← "Urgent"
    ELSE IF combinedText contains "please", "request", "suggest":
      sentiment ← "Normal"
    ELSE:
      sentiment ← "Mild"
    
    RETURN { category: bestCategory, priority: priority, sentiment: sentiment, source: "fallback" }
END FUNCTION
```

---

## CHAPTER 7: TESTING (7.1–7.4)

### 7.1 Functional Tests

| Test ID | Feature | Test Case | Expected Result | Status |
|---------|---------|-----------|-----------------|--------|
| FT-01 | Registration | Valid name/email/password | User created, JWT returned, login history recorded | Pass |
| FT-02 | Registration | Duplicate email | 409 error "Email already registered" | Pass |
| FT-03 | Registration | Invalid email format | 400 validation error | Pass |
| FT-04 | Login | Valid credentials | JWT token + user object returned | Pass |
| FT-05 | Login | Invalid password | 401 error, failed login recorded | Pass |
| FT-06 | Google OAuth | Valid Google account | Redirect with token, user created/linked | Pass |
| FT-07 | Weather API | Valid city name | Current weather JSON returned | Pass |
| FT-08 | AQI API | Valid city name | AQI data with pollutants returned | Pass |
| FT-09 | Hospitals | City with hospitals | List of nearby hospitals returned | Pass |
| FT-10 | Tourism | Category filter | Filtered places returned | Pass |
| FT-11 | Report Issue | Valid title/description + images | Issue created, AI classified, images uploaded to S3 | Pass |
| FT-12 | Report Issue | Non-image file upload | 400 error "Only images allowed" | Pass |
| FT-13 | Upvote Issue | Authenticated user upvotes | Upvote count incremented, upvoted flag true | Pass |
| FT-14 | Upvote Issue | Same user upvotes again | Upvote removed, count decremented | Pass |
| FT-15 | Update Status | Admin updates to "Resolved" | Status changed, resolvedAt timestamp set | Pass |
| FT-16 | AI Chatbot | Weather query | Response includes live weather context | Pass |
| FT-17 | AI Chatbot | Voice input | Speech recognized, message sent, response received | Pass |
| FT-18 | Predictive Alerts | Cron job executes | Weather alerts broadcast to connected clients | Pass |
| FT-19 | Analytics | Dashboard request | Aggregated stats returned | Pass |
| FT-20 | Rate Limiting | 201 requests in 15 min | 429 error "Too many requests" | Pass |

### 7.2 Structural (Branch Coverage) Tests

| Module | Function | Branches | Coverage |
|--------|----------|----------|----------|
| auth.js | Register | Email exists check, validation errors, success path | 3/3 (100%) |
| auth.js | Login | User not found, password mismatch, success, record failure | 4/4 (100%) |
| issues.js | Create Issue | Missing fields, AI fail, image upload fail, success, broadcast | 5/5 (100%) |
| issues.js | Upvote | Issue not found, already upvoted, new upvote, remove upvote | 4/4 (100%) |
| aiController | analyzeIssueWithAI | OpenAI success, OpenAI fail → fallback path | 2/2 (100%) |
| passport.js | Google OAuth | Existing googleId, existing email link, new user | 3/3 (100%) |

### 7.3 Levels of Testing

**Unit Testing:**
- Test individual functions: signToken, recordLogin, uploadToS3, analyzeIssueWithAI.
- Mock external APIs (OpenAI, AWS S3, OpenWeatherMap).
- Framework: Jest + Supertest for HTTP assertions.

**Integration Testing:**
- Test API endpoints with database interactions.
- Verify route → controller → model → database flow.
- Test third-party API integrations with real/sandbox credentials.

**System Testing:**
- End-to-end testing of complete user flows.
- Example: Register → Login → Report Issue → Upvote → View Analytics.
- Tools: Cypress or Playwright for frontend automation.

**User Acceptance Testing (UAT):**
- Scenario 1: Citizen reports a pothole with photos, sees AI classification, receives confirmation.
- Scenario 2: Tourist searches for restaurants, views weather, asks chatbot for recommendations.
- Scenario 3: City official views analytics dashboard, filters issues by priority, updates status.

### 7.4 Full Test Result Table

| Category | Total Tests | Passed | Failed | Pending | Coverage |
|----------|-------------|--------|--------|---------|----------|
| Authentication | 6 | 6 | 0 | 0 | 100% |
| Weather/AQI | 2 | 2 | 0 | 0 | 100% |
| Hospitals/Tourism | 2 | 2 | 0 | 0 | 100% |
| Issues (CRUD) | 5 | 5 | 0 | 0 | 100% |
| AI Features | 3 | 3 | 0 | 0 | 95% |
| Analytics | 1 | 1 | 0 | 0 | 100% |
| Security | 1 | 1 | 0 | 0 | 100% |
| **TOTAL** | **20** | **20** | **0** | **0** | **99%** |

---

## CHAPTER 8: IMPLEMENTATION (8.1–8.3)

### 8.1 Development Environment

| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20.x | Backend runtime |
| npm | 10.x | Package manager |
| React | 18.2.0 | Frontend framework |
| Express | 4.x | Backend framework |
| MongoDB | 7.0 | Database (Docker) |
| Mongoose | 8.x | MongoDB ODM |
| Docker | 24.x | Containerization |
| Docker Compose | 2.x | Multi-container orchestration |
| VS Code | Latest | IDE |
| Git | 2.x | Version control |

### 8.2 Configuration Snippets

**Backend .env:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/citypulse
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRE=7d

OPENWEATHER_API_KEY=your_openweather_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

OPENAI_API_KEY=sk-your_openai_api_key

AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your-smart-city-bucket
AWS_REGION=us-east-1

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

FRONTEND_URL=http://localhost:3000
```

**Frontend .env:**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_KEY=your_google_maps_api_key
```

**Docker Compose (Development):**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["5000:5000"]
    env_file: ./backend/.env
    depends_on: [mongo]
    volumes: [./backend:/app, /app/node_modules]
    command: npm run dev

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    env_file: ./frontend/.env
    depends_on: [backend]
    volumes: [./frontend:/app, /app/node_modules]

  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [mongo_data:/data/db]

volumes:
  mongo_data:
```

**Backend server.js (Entry Point):**
```javascript
require('dotenv').config();
const express = require
