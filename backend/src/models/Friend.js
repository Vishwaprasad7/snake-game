const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: 'Friend' },
  imageUrl: { type: String, required: true },
  publicId: { type: String }, // Cloudinary public_id for deletion
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Friend', friendSchema);
