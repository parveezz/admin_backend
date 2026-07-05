const express = require('express');
const { getActivities } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protection middleware to all activity routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Activity
 *   description: Activity log and audit trail endpoints for the admin portal
 */

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Retrieve a paginated list of all activities/audit logs
 *     tags: [Activity]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of activities per page
 *     responses:
 *       200:
 *         description: A list of activities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       action:
 *                         type: string
 *                       details:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           fullName:
 *                             type: string
 *                           emailAddress:
 *                             type: string
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.route('/').get(getActivities);

module.exports = router;
