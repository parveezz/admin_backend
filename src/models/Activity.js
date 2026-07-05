const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional, e.g., if a registration fails or it's a system event
    },
    action: {
      type: String,
      required: [true, 'Please provide an action name'],
      trim: true,
    },
    details: {
      type: String,
      required: [true, 'Please provide activity details'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Activity', ActivitySchema);
