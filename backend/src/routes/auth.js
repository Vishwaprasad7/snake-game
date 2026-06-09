const express = require('express');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

const router = express.Router();

// ---------- helpers ----------

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toPublicJSON(),
  });
};

// ---------- POST /register ----------

router.post(
  '/register',
  [
    body('username').trim().notEmpty().withMessage('Username is required')
      .isLength({ min: 2, max: 30 }).withMessage('Username must be 2-30 characters'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const { username, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      const user = await User.create({ username, email, password, provider: 'local' });
      sendTokenResponse(user, 201, res);
    } catch (err) {
      next(err);
    }
  }
);

// ---------- POST /login ----------

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  (req, res, next) => {
    if (!validate(req, res)) return;

    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ success: false, message: info?.message || 'Invalid credentials' });
      }
      if (user.isBanned) {
        return res.status(403).json({ success: false, message: 'Account is banned' });
      }
      user.lastSeen = Date.now();
      user.save().catch(() => {});
      sendTokenResponse(user, 200, res);
    })(req, res, next);
  }
);

// ---------- POST /guest ----------

router.post('/guest', async (req, res, next) => {
  try {
    const adjectives = ['Swift', 'Hungry', 'Sneaky', 'Brave', 'Wiggly', 'Speedy', 'Sly', 'Mighty', 'Lucky', 'Wild'];
    const nouns = ['Cobra', 'Viper', 'Python', 'Mamba', 'Rattler', 'Asp', 'Boa', 'Anaconda', 'Sidewinder', 'Adder'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const username = `${adj}${noun}${num}`;

    const user = await User.create({
      username,
      provider: 'guest',
      isGuest: true,
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
});

// ---------- GET /me ----------

router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

// ---------- Google OAuth ----------

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_failed` }),
  (req, res) => {
    const token = generateToken(req.user._id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
);

// ---------- GitHub OAuth ----------

router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'], session: false })
);

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=github_failed` }),
  (req, res) => {
    const token = generateToken(req.user._id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
);

module.exports = router;
