const express = require('express');
const {
  registerUser,
  loginUser,
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
  login2FA,
} = require('../controllers/auth');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration, login, forgot password, reset password, refresh token, and logout endpoints
 */

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Personal profile updates, password modifications, and Two-Factor Authentication (2FA) setup
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         fullName:
 *           type: string
 *           description: The full name of the user
 *         emailAddress:
 *           type: string
 *           description: The unique email address of the user
 *         role:
 *           type: string
 *           description: The role of the user (e.g. admin, user)
 *           enum: [user, admin]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was last updated
 *       example:
 *         id: 60d21b4667d0d8992e610c85
 *         fullName: John Doe
 *         emailAddress: johndoe@example.com
 *         createdAt: 2021-06-22T14:31:02.000Z
 *         updatedAt: 2021-06-22T14:31:02.000Z
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - emailAddress
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: The user's full name
 *               emailAddress:
 *                 type: string
 *                 description: The user's email address (accepts fullName or fullname, emailAddress or emailaddress)
 *               password:
 *                 type: string
 *                 description: Password (minimum 6 characters)
 *             example:
 *               fullName: John Doe
 *               emailAddress: johndoe@example.com
 *               password: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing fields, user already exists, or invalid input
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to an existing user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailAddress
 *               - password
 *             properties:
 *               emailAddress:
 *                 type: string
 *               password:
 *                 type: string
 *             example:
 *               emailAddress: johndoe@example.com
 *               password: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset verification code (OTP)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailAddress
 *             properties:
 *               emailAddress:
 *                 type: string
 *             example:
 *               emailAddress: johndoe@example.com
 *     responses:
 *       200:
 *         description: Verification OTP code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 previewUrl:
 *                   type: string
 *                   description: Sandbox preview link for checking the email (development mode)
 *                 otp:
 *                   type: string
 *                   description: 6-digit OTP verification code returned in dev mode for easy API calls
 *       400:
 *         description: Missing email address
 *       404:
 *         description: User email not found
 *       500:
 *         description: Server error or mail delivery failure
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   put:
 *     summary: Reset password using the 6-digit verification code (OTP)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailAddress
 *               - otp
 *               - password
 *             properties:
 *               emailAddress:
 *                 type: string
 *                 description: The user's email address
 *               otp:
 *                 type: string
 *                 description: The 6-digit verification code received in the email / API response
 *               password:
 *                 type: string
 *                 description: The new password (minimum 6 characters)
 *             example:
 *               emailAddress: johndoe@example.com
 *               otp: "123456"
 *               password: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid/expired OTP code, missing parameters, or password too short
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Retrieve profile details of currently logged-in user
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized (missing, expired or invalid token)
 *       500:
 *         description: Server error
 */

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify the 6-digit verification code (OTP)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailAddress
 *               - otp
 *             properties:
 *               emailAddress:
 *                 type: string
 *               otp:
 *                 type: string
 *             example:
 *               emailAddress: johndoe@example.com
 *               otp: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid or expired OTP code, or missing parameters
 *       500:
 *         description: Server error
 */
router.post('/verify-otp', verifyOTP);
router.put('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update profile details of currently logged-in user
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               emailAddress:
 *                 type: string
 *             example:
 *               fullName: John Smith
 *               emailAddress: johnsmith@example.com
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Missing fields or email already taken
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.put('/profile', protect, updateDetails);

/**
 * @swagger
 * /api/auth/update-password:
 *   put:
 *     summary: Update password of currently logged-in user
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *             example:
 *               currentPassword: password123
 *               newPassword: newpassword123
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid current password or new password too short
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.put('/update-password', protect, updatePassword);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using secure refresh cookie
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: New access token retrieved successfully
 *       401:
 *         description: Refresh token invalid or expired
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and invalidate refresh session
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.post('/logout', logoutUser);

/**
 * @swagger
 * /api/auth/2fa/setup:
 *   post:
 *     summary: Initiate Two-Factor Authentication Setup (Admin/User action)
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA secret and QR code generated successfully
 *       401:
 *         description: Not authorized
 */
router.post('/2fa/setup', protect, setup2FA);

/**
 * @swagger
 * /api/auth/2fa/verify:
 *   post:
 *     summary: Complete TOTP verification to enable 2FA
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: 6-digit TOTP verification code
 *             example:
 *               token: "123456"
 *     responses:
 *       200:
 *         description: 2FA verified and enabled successfully
 *       400:
 *         description: Invalid TOTP token or missing setup
 */
router.post('/2fa/verify', protect, verify2FA);

/**
 * @swagger
 * /api/auth/2fa/login:
 *   post:
 *     summary: Complete login verification using 2FA
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tempToken
 *               - token
 *             properties:
 *               tempToken:
 *                 type: string
 *                 description: Temporary token received from login attempt
 *               token:
 *                 type: string
 *                 description: 6-digit TOTP code
 *             example:
 *               tempToken: "eyJhbGciOiJIUzI1NiIsIn..."
 *               token: "123456"
 *     responses:
 *       200:
 *         description: Login verified and access token issued
 *       401:
 *         description: Temporary token expired or invalid
 */
router.post('/2fa/login', login2FA);

const upload = require('../middleware/uploadMiddleware');

// Local middleware to handle multer file validation errors cleanly for profile image uploads
const handleProfileImageUpload = (req, res, next) => {
  upload.single('profileImage')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
    next();
  });
};

/**
 * @swagger
 * /api/auth/profile-image:
 *   put:
 *     summary: Upload and update the profile avatar image of the currently logged-in user
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - profileImage
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: The profile image file (JPEG, PNG, GIF, WEBP, max 5MB)
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 *       400:
 *         description: Missing file or invalid type
 *       401:
 *         description: Not authorized
 */
router.put('/profile-image', protect, handleProfileImageUpload, updateProfileImage);

module.exports = router;
