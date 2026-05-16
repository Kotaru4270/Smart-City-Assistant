const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const jwt    = require('jsonwebtoken');
const passport = require('passport');
const User   = require('../models/User');
const { LoginHistory } = require('../models/LoginHistory');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const recordLogin = async (userId, req, method = 'email', success = true) => {
  try {
    await LoginHistory.create({
      user:      userId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      method,
      success,
    });
    await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
  } catch (e) { /* non-blocking */ }
};

const hasGoogleCreds = process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  !process.env.GOOGLE_CLIENT_ID.startsWith('your_') &&
  !process.env.GOOGLE_CLIENT_SECRET.startsWith('your_');

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const user = await User.create({ name, email, password });
    await recordLogin(user._id, req, 'email');
    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      await recordLogin(user._id, req, 'email', false);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    await recordLogin(user._id, req, 'email', true);
    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role, preferences: user.preferences },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Public config ────────────────────────────────────────────────────────────
router.get('/config', (req, res) => {
  res.json({ googleOAuth: hasGoogleCreds });
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────
if (hasGoogleCreds) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
    async (req, res) => {
      try {
        await recordLogin(req.user._id, req, 'google');
        const token = signToken(req.user._id);
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
      } catch (err) {
        res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
      }
    }
  );
}

// ─── Get current user ─────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

// ─── Update preferences ───────────────────────────────────────────────────────
router.put('/preferences', protect, async (req, res) => {
  try {
    const { preferredCity, interests, notifications } = req.body;
    const update = {};
    if (preferredCity !== undefined) update['preferences.preferredCity'] = preferredCity;
    if (interests)     update['preferences.interests'] = interests;
    if (notifications) update['preferences.notifications'] = notifications;
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Login History ────────────────────────────────────────────────────────────
router.get('/login-history', protect, async (req, res) => {
  try {
    const history = await LoginHistory.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(20);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
