const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Score = require('../models/Score');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ---------- POST / — save a new score ----------

router.post(
  '/',
  protect,
  [
    body('score').isInt({ min: 0 }).withMessage('Score must be a non-negative integer'),
    body('mode').optional().isIn(['classic', 'survival', 'time-attack', 'chaos', 'ai', 'wrap']).withMessage('Invalid game mode'),
    body('friendsEaten').optional().isInt({ min: 0 }),
    body('timeSurvived').optional().isInt({ min: 0 }),
    body('maxCombo').optional().isInt({ min: 0 }),
    body('powerUpsUsed').optional().isInt({ min: 0 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { score, mode, friendsEaten, timeSurvived, maxCombo, powerUpsUsed } = req.body;

      // Create score document
      const newScore = await Score.create({
        userId: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar,
        score,
        mode: mode || 'classic',
        friendsEaten: friendsEaten || 0,
        timeSurvived: timeSurvived || 0,
        maxCombo: maxCombo || 0,
        powerUpsUsed: powerUpsUsed || 0,
      });

      // Update user stats atomically
      const updateOps = {
        $inc: {
          'stats.totalGames': 1,
          'stats.totalFriendsEaten': friendsEaten || 0,
          'stats.totalTimePlayed': timeSurvived || 0,
        },
      };

      // Conditionally set highestScore and maxCombo if new values are higher
      // We need to do this in two steps to use $max
      await User.findByIdAndUpdate(req.user._id, updateOps);
      await User.findByIdAndUpdate(req.user._id, {
        $max: {
          'stats.highestScore': score,
          'stats.maxCombo': maxCombo || 0,
        },
      });

      res.status(201).json({ success: true, score: newScore });
    } catch (err) {
      next(err);
    }
  }
);

// ---------- GET /leaderboard ----------

router.get(
  '/leaderboard',
  [
    query('type').optional().isIn(['global', 'weekly', 'monthly']).withMessage('type must be global, weekly, or monthly'),
    query('mode').optional().isIn(['classic', 'survival', 'time-attack', 'chaos', 'ai', 'wrap']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { type = 'global', mode, limit = 20 } = req.query;
      const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);

      const filter = {};

      // Mode filter
      if (mode) {
        filter.mode = mode;
      }

      // Time-based filters
      const now = new Date();
      if (type === 'weekly') {
        const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const currentWeek = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        filter.week = currentWeek;
        filter.year = now.getFullYear();
      } else if (type === 'monthly') {
        filter.month = now.getMonth() + 1;
        filter.year = now.getFullYear();
      }

      const scores = await Score.find(filter)
        .sort({ score: -1, createdAt: 1 })
        .limit(parsedLimit)
        .select('userId username avatar score mode friendsEaten maxCombo timeSurvived createdAt')
        .lean();

      // Add rank numbers
      const ranked = scores.map((s, i) => ({ rank: i + 1, ...s }));

      res.json({ success: true, type, count: ranked.length, scores: ranked });
    } catch (err) {
      next(err);
    }
  }
);

// ---------- GET /my — current user's scores ----------

router.get('/my', protect, async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const [scores, total] = await Promise.all([
      Score.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Score.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      success: true,
      scores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
