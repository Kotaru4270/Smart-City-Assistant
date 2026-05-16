import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sc_token');
      localStorage.removeItem('sc_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:     (data)   => API.post('/auth/register', data),
  login:        (data)   => API.post('/auth/login', data),
  me:           ()       => API.get('/auth/me'),
  updatePrefs:  (data)   => API.put('/auth/preferences', data),
  loginHistory: ()       => API.get('/auth/login-history'),
};

// ─── Weather ──────────────────────────────────────────────────────────────────
export const weatherAPI = {
  current:  (city) => API.get('/weather/current', { params: { city } }),
  forecast: (city) => API.get('/weather/forecast', { params: { city } }),
  hourly:   (city) => API.get('/weather/hourly', { params: { city } }),
};

// ─── AQI ──────────────────────────────────────────────────────────────────────
export const aqiAPI = {
  current:  (city) => API.get('/aqi/current', { params: { city } }),
  forecast: (city) => API.get('/aqi/forecast', { params: { city } }),
};

// ─── Hospitals ────────────────────────────────────────────────────────────────
export const hospitalsAPI = {
  nearby:  (params) => API.get('/hospitals/nearby', { params }),
  details: (placeId) => API.get(`/hospitals/details/${placeId}`),
};

// ─── Tourism ──────────────────────────────────────────────────────────────────
export const tourismAPI = {
  nearby:       (params) => API.get('/tourism/nearby', { params }),
  search:       (params) => API.get('/tourism/search', { params }),
  autocomplete: (input)  => API.get('/tourism/autocomplete', { params: { input } }),
};

// ─── Issues ───────────────────────────────────────────────────────────────────
export const issuesAPI = {
  create:  (formData) => API.post('/issues', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list:    (params)   => API.get('/issues', { params }),
  get:     (id)       => API.get(`/issues/${id}`),
  upvote:  (id)       => API.post(`/issues/${id}/upvote`),
  status:  (id, s)    => API.put(`/issues/${id}/status`, { status: s }),
  stats:   (city)     => API.get('/issues/stats/summary', { params: { city } }),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiAPI = {
  chat:           (data) => API.post('/ai/chat', data),
  recommend:      (data) => API.post('/ai/recommend', data),
  alerts:         (city) => API.get('/ai/alerts', { params: { city } }),
  analyzeIssue:   (data) => API.post('/ai/analyze-issue', data),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  dashboard: (city) => API.get('/analytics/dashboard', { params: { city } }),
  user:      ()     => API.get('/analytics/user'),
  trends:    (p)    => API.get('/analytics/trends', { params: p }),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsAPI = {
  list:    ()   => API.get('/notifications'),
  read:    (id) => API.put(`/notifications/${id}/read`),
  readAll: ()   => API.put('/notifications/read-all'),
};

export default API;
