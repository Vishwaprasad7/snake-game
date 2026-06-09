const express = require('express');
const { protect } = require('../middleware/auth');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');
const User = require('../models/User');
const Friend = require('../models/Friend');

const router = express.Router();

// ---------- POST /player — upload player image ----------

router.post('/player', protect, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'friend-snake/players', {
      public_id: `player_${req.user._id}`,
      overwrite: true,
      transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }],
    });

    await User.findByIdAndUpdate(req.user._id, { playerImageUrl: result.secure_url });

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    next(err);
  }
});

// ---------- POST /friends — upload friend photos (max 10) ----------

router.post('/friends', protect, upload.array('photos', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files provided' });
    }

    // Get current friend count to enforce a total cap (e.g. 50)
    const existingCount = await Friend.countDocuments({ userId: req.user._id });
    if (existingCount + req.files.length > 50) {
      return res.status(400).json({
        success: false,
        message: `You can have at most 50 friends. Currently: ${existingCount}, attempted: ${req.files.length}`,
      });
    }

    const names = req.body.names
      ? (Array.isArray(req.body.names) ? req.body.names : [req.body.names])
      : [];

    const friends = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const result = await uploadToCloudinary(file.buffer, 'friend-snake/friends', {
        transformation: [{ width: 128, height: 128, crop: 'fill', gravity: 'face' }],
      });

      const friend = await Friend.create({
        userId: req.user._id,
        name: names[i] || file.originalname?.replace(/\.[^/.]+$/, '') || 'Friend',
        imageUrl: result.secure_url,
        publicId: result.public_id,
        order: existingCount + i,
      });

      friends.push(friend);
    }

    res.status(201).json({ success: true, friends });
  } catch (err) {
    next(err);
  }
});

// ---------- DELETE /friends/:id — remove a friend ----------

router.delete('/friends/:id', protect, async (req, res, next) => {
  try {
    const friend = await Friend.findById(req.params.id);

    if (!friend) {
      return res.status(404).json({ success: false, message: 'Friend not found' });
    }

    // Ensure the friend belongs to the requesting user
    if (friend.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this friend' });
    }

    // Remove from Cloudinary
    if (friend.publicId) {
      await deleteFromCloudinary(friend.publicId);
    }

    await Friend.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Friend deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
