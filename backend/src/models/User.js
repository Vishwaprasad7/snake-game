const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const achievementSchema = new mongoose.Schema({
  type: { type: String, required: true },
  title: String,
  description: String,
  unlockedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  password: { type: String, select: false },
  avatar: { type: String, default: '' },
  playerImageUrl: { type: String, default: '' },
  googleId: { type: String, sparse: true },
  githubId: { type: String, sparse: true },
  provider: { type: String, enum: ['local', 'google', 'github', 'guest'], default: 'local' },
  isAdmin: { type: Boolean, default: false },
  isGuest: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  stats: {
    totalGames: { type: Number, default: 0 },
    totalFriendsEaten: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    totalTimePlayed: { type: Number, default: 0 },
    maxCombo: { type: Number, default: 0 },
  },
  achievements: [achievementSchema],
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
