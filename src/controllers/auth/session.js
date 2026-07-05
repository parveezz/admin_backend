const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const { generateToken } = require('./tokenHelper');

/**
 * @desc    Refresh session access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, no refresh token provided',
      });
    }

    // Verify token validity
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Verify token exists in database list
    const user = await User.findOne({ _id: decoded.id, refreshTokens: refreshToken, isDeleted: { $ne: true } });

    if (!user) {
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        error: 'Not authorized, refresh token invalid or session revoked',
      });
    }

    // Generate new Access Token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    res.clearCookie('refreshToken');
    return res.status(401).json({
      success: false,
      error: 'Not authorized, refresh token session expired',
    });
  }
};

/**
 * @desc    Logout user and clear session
 * @route   POST /api/auth/logout
 * @access  Public
 */
exports.logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Pull token from user database record to invalidate session
      await User.updateMany(
        { refreshTokens: refreshToken },
        { $pull: { refreshTokens: refreshToken } }
      );
    }

    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      message: 'Successfully logged out and session cleared',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
