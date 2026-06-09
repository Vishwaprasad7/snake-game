const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  avatar: { type: String },
  score: { type: Number, required: true, default: 0 },
  mode: {
    type: String,
    enum: ['classic', 'survival', 'time-attack', 'chaos', 'ai', 'wrap'],
    default: 'classic',
  },
  friendsEaten: { type: Number, default: 0 },
  timeSurvived: { type: Number, default: 0 }, // seconds
  maxCombo: { type: Number, default: 0 },
  powerUpsUsed: { type: Number, default: 0 },
  week: { type: Number },    // ISO week number
  month: { type: Number },   // month number
  year: { type: Number },
}, { timestamps: true });

scoreSchema.pre('save', function(next) {
  const now = new Date();
  this.year = now.getFullYear();
  this.month = now.getMonth() + 1;
  // ISO week
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  this.week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  next();
});

module.exports = mongoose.model('Score', scoreSchema);
