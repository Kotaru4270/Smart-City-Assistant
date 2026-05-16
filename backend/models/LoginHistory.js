const mongoose = require('mongoose');

// ─── Login History ─────────────────────────────────────────────────────────────
const loginHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ipAddress: String,
  userAgent: String,
  city: String,
  country: String,
  method: {
    type: String,
    enum: ['email', 'google'],
    default: 'email',
  },
  success: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now },
});

loginHistorySchema.index({ user: 1, timestamp: -1 });

// ─── Notification ──────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['aqi_alert', 'weather_alert', 'issue_update', 'recommendation', 'system'],
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: {
    type: String,
    enum: ['info', 'warning', 'danger', 'success'],
    default: 'info',
  },
  city: String,
  read: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed }, // Extra payload
}, {
  timestamps: true,
});

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = {
  LoginHistory: mongoose.model('LoginHistory', loginHistorySchema),
  Notification:  mongoose.model('Notification', notificationSchema),
};
