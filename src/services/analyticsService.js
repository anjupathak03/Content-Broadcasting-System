const analyticsModel = require('../models/analyticsModel');
const { notFound } = require('../utils/errors');

async function getSubjectUsage(filters) {
  return analyticsModel.subjectUsage(filters);
}

async function getContentUsage(contentId) {
  const usage = await analyticsModel.contentUsage(contentId);
  if (!usage) throw notFound('Content not found');

  return {
    id: Number(usage.id),
    title: usage.title,
    subject: usage.subject,
    total_hits: Number(usage.total_hits),
    latest_hit_at: usage.latest_hit_at,
  };
}

module.exports = {
  getSubjectUsage,
  getContentUsage,
};
