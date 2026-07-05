const { registerUser } = require('./register');
const { loginUser, login2FA } = require('./login');
const { forgotPassword, verifyOTP, resetPassword } = require('./recovery');
const { getMe, updateDetails, updatePassword } = require('./profile');
const { updateProfileImage } = require('./profileImage');
const { refreshToken, logoutUser } = require('./session');
const { setup2FA, verify2FA } = require('./twoFactor');

module.exports = {
  registerUser,
  loginUser,
  login2FA,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getMe,
  updateDetails,
  updatePassword,
  updateProfileImage,
  refreshToken,
  logoutUser,
  setup2FA,
  verify2FA,
};
