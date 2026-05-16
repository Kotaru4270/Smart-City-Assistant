const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    minlength: 6,
    select: false,
  },
  avatar: { type: String, default: '' },
  googleId: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  // Preferences for personalization
  preferences: {
    preferredCity: { type: String, default: '' },
    interests: [{ type: String }], // e.g., ['tourism', 'health', 'environment']
    notifications: {
      aqi: { type: Boolean, default: true },
      weather: { type: Boolean, default: true },
      issues: { type: Boolean, default: true },
    },
  },

  // Behavior analytics
  searchHistory: [{
    query: String,
    type: { type: String, enum: ['city', 'hospital', 'tourism', 'general'] },
    timestamp: { type: Date, default: Date.now },
  }],

  favoriteHospitals: [{ type: String }],  // place_ids
  favoritePlaces:    [{ type: String }],  // place_ids

  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Add to search history (keep last 50)
userSchema.methods.addSearchHistory = async function (query, type = 'general') {
  this.searchHistory.unshift({ query, type, timestamp: new Date() });
  if (this.searchHistory.length > 50) this.searchHistory = this.searchHistory.slice(0, 50);
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
