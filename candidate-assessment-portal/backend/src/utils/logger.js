const ActivityLog = require('../modules/analytics/activityLog.model');

const log = async ({ userId, candidateId, action, entity, entityId, details, ip }) => {
  try {
    await ActivityLog.create({ userId, candidateId, action, entity, entityId, details, ip });
  } catch (e) {
    console.error('Activity log error:', e.message);
  }
};

module.exports = { log };
