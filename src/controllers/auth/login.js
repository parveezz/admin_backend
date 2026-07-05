const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const { sendTokenResponse } = require('./tokenHelper');

/**
 * @desc    Login existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.loginUser = async (req, res, next) => {
  try {
    const emailAddress = req.body.emailAddress || req.body.emailaddress;
    const password = req.body.password;

    if (!emailAddress || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide emailAddress and password',
      });
    }

    // Find user and explicitly select password field
    const user = await User.findOne({ emailAddress: emailAddress.toLowerCase(), isDeleted: { $ne: true } }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // If Two-Factor Authentication is enabled, require code verification first
    if (user.isTwoFactorEnabled) {
      // Generate temporary session token
      const tempToken = jwt.sign({ id: user._id, isTemp: true }, process.env.JWT_SECRET, {
        expiresIn: '5m',
      });
      return res.status(200).json({
        success: true,
        require2FA: true,
        tempToken,
      });
    }

    // Otherwise standard login - send access token and secure refresh cookie
    await sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};

/**
 * @desc    Complete login verification using 2FA
 * @route   POST /api/auth/2fa/login
 * @access  Public
 */
exports.login2FA = async (req, res, next) => {
  try {
    const { tempToken, token } = req.body;

    if (!tempToken || !token) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both the tempToken and the 2FA token code',
      });
    }

    // Verify tempToken
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Temporary session expired. Please perform standard login again.',
      });
    }

    if (!decoded.isTemp) {
      return res.status(401).json({
        success: false,
        error: 'Invalid temporary session token configuration',
      });
    }

    // Retrieve user and 2FA secret
    const user = await User.findOne({ _id: decoded.id, isDeleted: { $ne: true } }).select('+twoFactorSecret');

    if (!user || !user.twoFactorSecret || !user.isTwoFactorEnabled) {
      return res.status(400).json({
        success: false,
        error: '2FA is not enabled or user not found',
      });
    }

    // Verify code
    const isVerified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1,
    });

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code. Please check your app.',
      });
    }

    // Complete login, issue tokens
    await sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
