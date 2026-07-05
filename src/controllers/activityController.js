const Activity = require('../models/Activity');

/**
 * @desc    Get all activities (paginated)
 * @route   GET /api/activities
 * @access  Private
 */
exports.getActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Activity.countDocuments();
    const activities = await Activity.find()
      .populate('user', 'fullName emailAddress')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: activities.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      activities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
