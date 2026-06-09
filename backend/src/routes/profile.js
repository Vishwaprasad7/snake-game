const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Friend = require('../models/Friend');
const Score = require('../models/Score');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ---------- GET /:id — public profile ----------

router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username avatar playerImageUrl stats achievements isGuest createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Attach additional public stats
    const [friendCount, recentScores] = await Promise.all([
      Friend.countDocuments({ userId: req.params.id }),
      Score.find({ userId: req.params.id })
        .sort({ score: -1 })
        .limit(5)
        .select('score mode friendsEaten maxCombo createdAt')
        .lean(),
    ]);

    res.json({
      success: true,
      profile: {
        ...user,
        friendCount,
        topScores: recentScores,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------- PUT / — update own profile ----------

router.put(
  '/',
  protect,
  [
    body('username').optional().trim()
      .isLength({ min: 2, max: 30 }).withMessage('Username must be 2-30 characters'),
    body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const updates = {};
      if (req.body.username !== undefined) updates.username = req.body.username;
      if (req.body.avatar !== undefined) updates.avatar = req.body.avatar;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'No valid fields to update' });
      }

      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, user: user.toPublicJSON() });
    } catch (err) {
      next(err);
    }
  }
);

// ---------- GET /:id/achievements ----------

router.get('/:id/achievements', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('achievements username')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      username: user.username,
      achievements: user.achievements || [],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
