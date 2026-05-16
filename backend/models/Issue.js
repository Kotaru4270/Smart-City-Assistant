const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 2000,
  },
  category: {
    type: String,
    enum: ['Road', 'Water', 'Electricity', 'Pollution', 'Sanitation', 'Other'],
    default: 'Other',
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
  },
  sentiment: {
    type: String,
    enum: ['Urgent', 'Normal', 'Mild'],
    default: 'Normal',
  },
  aiAnalysis: {
    classification: String,
    confidence: Number,
    reasoning: String,
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open',
  },
  location: {
    address: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  images: [{ type: String }], // S3 URLs
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    timestamp: { type: Date, default: Date.now },
  }],
  resolvedAt: Date,
}, {
  timestamps: true,
});

// Index for analytics queries
issueSchema.index({ category: 1, createdAt: -1 });
issueSchema.index({ 'location.city': 1, createdAt: -1 });
issueSchema.index({ status: 1 });

module.exports = mongoose.model('Issue', issueSchema);
