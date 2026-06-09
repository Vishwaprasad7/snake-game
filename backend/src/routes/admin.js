const express = require('express');
const User = require('../models/User');
const Score = require('../models/Score');
const Friend = require('../models/Friend');
const { protect, adminOnly } = require('../middleware/auth');
const { deleteFromCloudinary } = require('../middleware/upload');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// ---------- GET /users — paginated user list with search ----------

router.get('/users', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      users,
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

// ---------- GET /analytics ----------

router.get('/analytics', async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalUsers, totalGames, activeToday, topScores] = await Promise.all([
      User.countDocuments(),
      Score.countDocuments(),
      User.countDocuments({ lastSeen: { $gte: todayStart } }),
      Score.find()
        .sort({ score: -1 })
        .limit(10)
        .select('userId username score mode createdAt')
        .lean(),
    ]);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalGames,
        activeToday,
        topScores,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------- PUT /users/:id/ban — toggle ban ----------

router.put('/users/:id/ban', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent banning yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot ban yourself' });
    }

    // Prevent banning other admins
    if (user.isAdmin) {
      return res.status(400).json({ success: false, message: 'Cannot ban another admin' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({
      success: true,
      message: user.isBanned ? 'User has been banned' : 'User has been unbanned',
      user: { _id: user._id, username: user.username, isBanned: user.isBanned },
    });
  } catch (err) {
    next(err);
  }
});

// ---------- DELETE /users/:id — delete user ----------

router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    // Prevent deleting other admins
    if (user.isAdmin) {
      return res.status(400).json({ success: false, message: 'Cannot delete another admin' });
    }

    // Clean up Cloudinary images for the user's friends
    const friends = await Friend.find({ userId: req.params.id }).select('publicId').lean();
    const cloudinaryDeletions = friends
      .filter(f => f.publicId)
      .map(f => deleteFromCloudinary(f.publicId).catch(() => {}));
    await Promise.all(cloudinaryDeletions);

    // Delete all related data
    await Promise.all([
      Score.deleteMany({ userId: req.params.id }),
      Friend.deleteMany({ userId: req.params.id }),
      User.findByIdAndDelete(req.params.id),
    ]);

    res.json({ success: true, message: 'User and all related data deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
