const router  = require('express').Router();
const multer  = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { protect, optionalAuth } = require('../middleware/auth');
const Issue   = require('../models/Issue');
const { analyzeIssueWithAI } = require('../controllers/aiController');

// ─── S3 Setup ─────────────────────────────────────────────────────────────────
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ─── Multer Setup ─────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  },
});

// ─── Upload to S3 (FIXED) ─────────────────────────────────────────────────────
const uploadToS3 = async (file) => {
  const key = `issues/${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;

  try {
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
      // ❌ Removed ACL (important fix)
    }));

    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (err) {
    console.error('S3 Upload Error:', err.message);
    throw new Error('Failed to upload image');
  }
};

// ─── Report Issue ─────────────────────────────────────────────────────────────
router.post('/', protect, upload.array('images', 3), async (req, res) => {
  try {
    const { title, description, address, city, lat, lng } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required' });
    }

    // AI analysis
    const ai = await analyzeIssueWithAI(title, description);

    // Upload images
    let imageUrls = [];
    if (req.files?.length) {
      imageUrls = await Promise.all(req.files.map(uploadToS3));
    }

    const issue = await Issue.create({
      title,
      description,
      category:   ai.category,
      priority:   ai.priority,
      sentiment:  ai.sentiment,
      aiAnalysis: ai,
      location: {
        address: address || '',
        city:    city    || '',
        coordinates: {
          lat: parseFloat(lat) || 0,
          lng: parseFloat(lng) || 0
        },
      },
      images:     imageUrls,
      reportedBy: req.user._id,
    });

    await issue.populate('reportedBy', 'name avatar');

    // Real-time broadcast
    const io = req.app.get('io');
    if (io) io.to(`city:${city}`).emit('new-issue', issue);

    res.status(201).json({ issue });

  } catch (err) {
    console.error('Issue Creation Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Get Issues ───────────────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { city, category, priority, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (city)     filter['location.city'] = new RegExp(city, 'i');
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (status)   filter.status   = status;

    const total  = await Issue.countDocuments(filter);

    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      issues,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error('Fetch Issues Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Get Single Issue ─────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name avatar');

    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    res.json({ issue });

  } catch (err) {
    console.error('Get Issue Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Upvote ───────────────────────────────────────────────────────────────────
router.post('/:id/upvote', protect, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Not found' });

    const idx = issue.upvotes.indexOf(req.user._id);

    if (idx > -1) issue.upvotes.splice(idx, 1);
    else issue.upvotes.push(req.user._id);

    await issue.save();

    res.json({
      upvotes: issue.upvotes.length,
      upvoted: idx === -1
    });

  } catch (err) {
    console.error('Upvote Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Update Status ────────────────────────────────────────────────────────────
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(status === 'Resolved' ? { resolvedAt: new Date() } : {})
      },
      { new: true }
    ).populate('reportedBy', 'name avatar');

    res.json({ issue });

  } catch (err) {
    console.error('Update Status Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Analytics ────────────────────────────────────────────────────────────────
router.get('/stats/summary', async (req, res) => {
  try {
    const { city } = req.query;

    const filter = city ? { 'location.city': new RegExp(city, 'i') } : {};

    const [categoryStats, statusStats, priorityStats, recentTrend] = await Promise.all([
      Issue.aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Issue.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Issue.aggregate([
        { $match: filter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Issue.aggregate([
        {
          $match: {
            ...filter,
            createdAt: { $gte: new Date(Date.now() - 30 * 86400000) }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      categoryStats,
      statusStats,
      priorityStats,
      recentTrend
    });

  } catch (err) {
    console.error('Analytics Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;