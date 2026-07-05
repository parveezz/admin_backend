const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  restoreUser,
} = require('../controllers/user');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protection middleware to all user routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints for the admin portal
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve a list of all registered users
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new user (Admin action)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
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
 *               emailAddress:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *             example:
 *               fullName: Jane Doe
 *               emailAddress: janedoe@example.com
 *               password: password123
 *               role: user
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing fields or user already exists
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.route('/')
  .get(getUsers)
  .post(createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get details of a single user by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
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
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update user details by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
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
 *               password:
 *                 type: string
 *                 description: Optional new password to change
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *             example:
 *               fullName: Jane Smith
 *               role: admin
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Email already in use
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Suspend or activate a user account (Admin action)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to suspend or activate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, suspended]
 *             example:
 *               status: suspended
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Invalid status or self-suspension attempt
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden, user not admin
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.route('/:id/status').patch(authorize('admin'), toggleUserStatus);

/**
 * @swagger
 * /api/users/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted user account (Admin action)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to restore
 *     responses:
 *       200:
 *         description: User account restored successfully
 *       400:
 *         description: User account is already active
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden, user not admin
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.route('/:id/restore').patch(authorize('admin'), restoreUser);

module.exports = router;
