const User = require('../../models/User');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const logActivity = require('../../utils/activityLogger');

/**
 * @desc    Set up Two-Factor Authentication (Generate Secret & QR Code)
 * @route   POST /api/auth/2fa/setup
 * @access  Private
 */
exports.setup2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Generate 2FA Secret Key
    const secret = speakeasy.generateSecret({
      name: `UserAuthAPI:${user.emailAddress}`,
    });

    // Save temporary secret to database
    await User.findByIdAndUpdate(req.user.id, {
      twoFactorSecret: secret.base32,
    });

    // Generate QR Code representation
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      message: '2FA generated. Please verify the code using verify endpoint.',
      secret: secret.base32,
      qrCode: qrCodeUrl,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};

/**
 * @desc    Verify TOTP Code to Enable 2FA
 * @route   POST /api/auth/2fa/verify
 * @access  Private
 */
exports.verify2FA = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Please provide the 6-digit verification code from your authenticator app',
      });
    }

    // Fetch user including hidden secret
    const user = await User.findById(req.user.id).select('+twoFactorSecret');

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        error: '2FA secret not found. Run setup endpoint first.',
      });
    }

    // Verify code
    const isVerified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1, // 30-second window tolerance
    });

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token code. Please check your app.',
      });
    }

    // Set 2FA status to enabled
    user.isTwoFactorEnabled = true;
    await user.save();

    // Log the security modification
    await logActivity(user._id, '2FA Enabled', 'Activated Two-Factor Authentication (2FA) protection');

    res.status(200).json({
      success: true,
      message: 'Two-Factor Authentication activated successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
};
