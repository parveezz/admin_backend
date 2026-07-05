const User = require('../../models/User');

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    // CastError check (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
