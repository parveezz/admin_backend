const User = require('../../models/User');
const sendEmail = require('../../utils/sendEmail');
const crypto = require('crypto');
const logActivity = require('../../utils/activityLogger');
const { sendTokenResponse } = require('./tokenHelper');

/**
 * @desc    Forgot Password - Send Reset Link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const emailAddress = req.body.emailAddress || req.body.emailaddress;

    if (!emailAddress) {
      return res.status(400).json({
        success: false,
        error: 'Please provide emailAddress',
      });
    }

    const user = await User.findOne({ emailAddress: emailAddress.toLowerCase(), isDeleted: { $ne: true } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No user registered with this email address',
      });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate OTP in 15 minutes
    const otpExpire = Date.now() + 15 * 60 * 1000;

    // Hash OTP to save in DB for security
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordOTPExpire = otpExpire;
    await user.save();

    // Prepare email message
    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Please use the following 6-digit OTP code to complete the verification:</p>
      <h2 style="letter-spacing: 5px; font-size: 32px; color: #4F46E5;">${otp}</h2>
      <p>This code will expire in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        email: user.emailAddress,
        subject: 'Password Reset Verification Code (OTP)',
        message,
      });

      await logActivity(user._id, 'Password Reset Requested', `Sent reset password OTP code to ${user.emailAddress}`);

      // For developer convenience (non-production) we expose the OTP in payload
      const devPayload = {};
      if (process.env.NODE_ENV !== 'production') {
        devPayload.otp = otp;
      }

      res.status(200).json({
        success: true,
        message: 'Verification code (OTP) sent successfully via email',
        ...devPayload,
      });
    } catch (err) {
      user.resetPasswordOTP = undefined;
      user.resetPasswordOTPExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        error: 'Email could not be sent',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};

/**
 * @desc    Verify OTP Code
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const emailAddress = req.body.emailAddress || req.body.emailaddress;
    const otp = req.body.otp;

    if (!emailAddress || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both emailAddress and otp',
      });
    }

    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // Find user with matching email, matching OTP, and unexpired date
    const user = await User.findOne({
      emailAddress: emailAddress.toLowerCase(),
      resetPasswordOTP: hashedOTP,
      resetPasswordOTPExpire: { $gt: Date.now() },
      isDeleted: { $ne: true },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code (OTP)',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code is valid. You can now reset your password.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};

/**
 * @desc    Reset Password
 * @route   PUT /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const emailAddress = req.body.emailAddress || req.body.emailaddress;
    const otp = req.body.otp;
    const newPassword = req.body.password;

    if (!emailAddress || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide emailAddress, otp, and password',
      });
    }

    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // Find user with matching email, matching OTP, and unexpired date
    const user = await User.findOne({
      emailAddress: emailAddress.toLowerCase(),
      resetPasswordOTP: hashedOTP,
      resetPasswordOTPExpire: { $gt: Date.now() },
      isDeleted: { $ne: true },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code (OTP)',
      });
    }

    // Set new password and invalidate active refresh tokens across all devices
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    user.refreshTokens = []; // clear sessions

    await user.save();

    // Send access token and refresh cookie response
    await sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
