require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
const cron = require('node-cron');

const app = express();
const httpServer = createServer(app);

// Allow multiple frontend origins for local dev
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(passport.initialize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Passport Config ──────────────────────────────────────────────────────────
require('./middleware/passport')(passport);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/weather',     require('./routes/weather'));
app.use('/api/aqi',         require('./routes/aqi'));
app.use('/api/hospitals',   require('./routes/hospitals'));
app.use('/api/tourism',     require('./routes/tourism'));
app.use('/api/issues',      require('./routes/issues'));
app.use('/api/ai',          require('./routes/ai'));
app.use('/api/analytics',   require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-city', (city) => {
    socket.join(`city:${city}`);
    console.log(`Socket ${socket.id} joined city: ${city}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Make io accessible in routes
app.set('io', io);

// ─── Scheduled Jobs ───────────────────────────────────────────────────────────
cron.schedule('*/30 * * * *', async () => {
  try {
    const { broadcastWeatherAlerts } = require('./controllers/notificationController');
    await broadcastWeatherAlerts(io);
  } catch (err) {
    console.error('Cron job error:', err.message);
  }
});

// ─── MongoDB ──────────────────────────────────────────────────────────────────
const bootstrapAdmin = async () => {
  try {
    const User = require('./models/User');
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) return;

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@smartcity.local').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!';
    const adminName = process.env.ADMIN_NAME || 'City Admin';

    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    console.log('✅ Admin account created successfully');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${adminPassword}`);
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log('⚠️ WARNING: Default admin credentials were used. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to secure the account.');
    }
  } catch (err) {
    console.error('Admin bootstrap error:', err.message);
  }
};

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await bootstrapAdmin();
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = { io };
