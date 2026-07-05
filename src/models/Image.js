const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, 'Please provide a file name'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Please provide a file URL'],
      trim: true,
    },
    size: {
      type: Number,
      required: [true, 'Please provide the file size in bytes'],
    },
    format: {
      type: String,
      required: [true, 'Please provide the file format (extension/MIME)'],
      trim: true,
      lowercase: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide the user who uploaded the image'],
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    cloudId: {
      type: String,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Image', ImageSchema);
