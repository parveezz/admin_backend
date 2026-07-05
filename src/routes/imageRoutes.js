const express = require('express');
const { getImages, moderateImage, deleteImage, uploadImage } = require('../controllers/image');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Helper middleware to handle multer errors cleanly
const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
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
 * /api/images/upload:
 *   post:
 *     summary: Upload a new image (Authenticated user action)
 *     tags: [Images]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload (JPEG, PNG, GIF, WEBP, max 5MB)
 *     responses:
 *       201:
 *         description: Image uploaded successfully and set to pending moderation
 *       400:
 *         description: Invalid file type or file too large
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/upload', protect, handleUpload, uploadImage);

// Apply protection and admin authorization to remaining image routes
router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * tags:
 *   name: Images
 *   description: Image moderation and management endpoints for the admin portal
 */

/**
 * @swagger
 * /api/images:
 *   get:
 *     summary: Retrieve a paginated list of uploaded images (Admin action)
 *     tags: [Images]
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
 *         description: Number of images per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter images by their moderation status
 *     responses:
 *       200:
 *         description: Images retrieved successfully
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
 *                 images:
 *                   type: array
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden, user not admin
 *       500:
 *         description: Server error
 */
router.route('/').get(getImages);

/**
 * @swagger
 * /api/images/{id}/moderate:
 *   patch:
 *     summary: Approve or reject an uploaded image (Admin action)
 *     tags: [Images]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the image to moderate
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
 *                 enum: [approved, rejected]
 *             example:
 *               status: approved
 *     responses:
 *       200:
 *         description: Image moderation status updated successfully
 *       400:
 *         description: Invalid input status
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden, user not admin
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.route('/:id/moderate').patch(moderateImage);

/**
 * @swagger
 * /api/images/{id}:
 *   delete:
 *     summary: Permanently delete an image record (Admin action)
 *     tags: [Images]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the image to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden, user not admin
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.route('/:id').delete(deleteImage);

module.exports = router;
