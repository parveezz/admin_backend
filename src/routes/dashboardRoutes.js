const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protection middleware to all dashboard routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard and statistics endpoints for the admin portal
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Retrieve dashboard statistics (user growth, storage size, formats, uploads, and recent activity)
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                         totalImages:
 *                           type: integer
 *                         totalStorageUsedBytes:
 *                           type: integer
 *                         storageLimitBytes:
 *                           type: integer
 *                         storagePercentageUsed:
 *                           type: number
 *                     charts:
 *                       type: object
 *                       properties:
 *                         userGrowth:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                               registrations:
 *                                 type: integer
 *                         weeklyUploads:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                               uploads:
 *                                 type: integer
 *                         imageFormats:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               format:
 *                                 type: string
 *                               count:
 *                                 type: integer
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           action:
 *                             type: string
 *                           details:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.route('/').get(getDashboardStats);

module.exports = router;
