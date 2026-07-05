const User = require('../models/User');
const Image = require('../models/Image');
const Activity = require('../models/Activity');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard
 * @access  Private
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Fetch counts & sizes
    const totalUsers = await User.countDocuments({});
    const totalImages = await Image.countDocuments({});

    const storageUsage = await Image.aggregate([
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$size' },
        },
      },
    ]);
    const totalStorageUsedBytes = storageUsage[0]?.totalSize || 0;
    const storageLimitBytes = 5 * 1024 * 1024 * 1024; // 5 GB limit
    const storagePercentageUsed = parseFloat(
      ((totalStorageUsedBytes / storageLimitBytes) * 100).toFixed(2)
    );

    // Helper for 7 days dates initialization
    const getSevenDaysTimeline = () => {
      const timeline = new Map();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        timeline.set(dateStr, 0);
      }
      return timeline;
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 2. User Growth Chart Aggregation
    const userGrowthData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]);

    const userGrowthTimeline = getSevenDaysTimeline();
    userGrowthData.forEach((item) => {
      if (userGrowthTimeline.has(item._id)) {
        userGrowthTimeline.set(item._id, item.count);
      }
    });

    const userGrowth = Array.from(userGrowthTimeline.entries()).map(([date, registrations]) => ({
      date,
      registrations,
    }));

    // 3. Weekly Uploads Chart Aggregation
    const weeklyUploadsData = await Image.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]);

    const weeklyUploadsTimeline = getSevenDaysTimeline();
    weeklyUploadsData.forEach((item) => {
      if (weeklyUploadsTimeline.has(item._id)) {
        weeklyUploadsTimeline.set(item._id, item.count);
      }
    });

    const weeklyUploads = Array.from(weeklyUploadsTimeline.entries()).map(([date, uploads]) => ({
      date,
      uploads,
    }));

    // 4. Image Formats Aggregation (Pie Chart)
    const formatData = await Image.aggregate([
      {
        $group: {
          _id: '$format',
          count: { $sum: 1 },
        },
      },
    ]);
    const imageFormats = formatData.map((item) => ({
      format: (item._id || 'unknown').toUpperCase(),
      count: item.count,
    }));

    // 5. Recent Activity (from dedicated Activity collection)
    const activities = await Activity.find({})
      .populate('user', 'fullName emailAddress')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentActivity = activities.map((act) => ({
      id: act._id,
      action: act.action,
      details: act.details,
      createdAt: act.createdAt,
    }));

    res.status(200).json({
      success: true,
      stats: {
        summary: {
          totalUsers,
          totalImages,
          totalStorageUsedBytes,
          storageLimitBytes,
          storagePercentageUsed,
        },
        charts: {
          userGrowth,
          imageFormats,
          weeklyUploads,
        },
        recentActivity,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
