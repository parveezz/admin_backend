const Activity = require('../models/Activity');

/**
 * Utility to log user actions to the database.
 * Does not block/throw on logging errors to avoid disrupting main application flow.
 * 
 * @param {string} userId - ID of the user performing the action (optional)
 * @param {string} action - The type/name of the action
 * @param {string} details - Human-readable details of the action
 */
const logActivity = async (userId, action, details) => {
  try {
    await Activity.create({
      user: userId || undefined,
      action,
      details,
    });
  } catch (error) {
    console.error(`Failed to log activity: ${error.message}`);
  }
};

module.exports = logActivity;
