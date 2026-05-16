const router = require('express').Router();
const { protect } = require('../middleware/auth');
const Issue        = require('../models/Issue');
const User         = require('../models/User');
const { LoginHistory } = require('../models/LoginHistory');

// ─── City Dashboard Stats ─────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  const { city } = req.query;
  try {
    const filter = city ? { 'location.city': new RegExp(city, 'i') } : {};
    const [
      totalIssues,
      openIssues,
      resolvedIssues,
      categoryBreakdown,
      trend30Days,
      topCities,
    ] = await Promise.all([
      Issue.countDocuments(filter),
      Issue.countDocuments({ ...filter, status: 'Open' }),
      Issue.countDocuments({ ...filter, status: 'Resolved' }),
      Issue.aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } } } },
        { $sort: { count: -1 } },
      ]),
      Issue.aggregate([
        { $match: { ...filter, createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Issue.aggregate([
        { $group: { _id: '$location.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({ totalIssues, openIssues, resolvedIssues, categoryBreakdown, trend30Days, topCities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── User Activity Analytics ──────────────────────────────────────────────────
router.get('/user', protect, async (req, res) => {
  try {
    const [myIssues, loginHistory, searchHistory] = await Promise.all([
      Issue.find({ reportedBy: req.user._id }).select('title category status createdAt').sort({ createdAt: -1 }).limit(10),
      LoginHistory.find({ user: req.user._id }).sort({ timestamp: -1 }).limit(10),
      req.user.searchHistory?.slice(0, 10) || [],
    ]);

    res.json({ myIssues, loginHistory, searchHistory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Trend Analysis ───────────────────────────────────────────────────────────
router.get('/trends', async (req, res) => {
  const { city, days = 30 } = req.query;
  try {
    const filter = { createdAt: { $gte: new Date(Date.now() - days * 86400000) } };
    if (city) filter['location.city'] = new RegExp(city, 'i');

    const [byCategory, byPriority, byStatus, dailyVolume] = await Promise.all([
      Issue.aggregate([{ $match: filter }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Issue.aggregate([{ $match: filter }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Issue.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Issue.aggregate([
        { $match: filter },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({ byCategory, byPriority, byStatus, dailyVolume });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
