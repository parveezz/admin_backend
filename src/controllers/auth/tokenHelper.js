const jwt = require('jsonwebtoken');
const User = require('../../models/User');

/**
 * Generate Access Token
 * @param {string} id - User ID
 * @returns {string} - JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

/**
 * Set Secure Refresh Cookie and Return JSON Access Token
 * @param {object} user - User Database Document
 * @param {number} statusCode - HTTP Status Code
 * @param {object} res - Express Response Object
 */
const sendTokenResponse = async (user, statusCode, res) => {
  const token = generateToken(user._id);

  // Generate Refresh Token (7 days)
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  // Store refresh token in user document
  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: refreshToken },
  });

  // HTTP-Only Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  };

  res
    .status(statusCode)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        role: user.role,
        profileImage: user.profileImage || "",
      },
    });
};

module.exports = {
  generateToken,
  sendTokenResponse,
};
