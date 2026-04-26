const analyticsService = require('../services/analyticsService');

async function subjectUsage(req, res) {
  const data = await analyticsService.getSubjectUsage(req.query);
  res.json({
    success: true,
    data,
  });
}

async function contentUsage(req, res) {
  const data = await analyticsService.getContentUsage(req.params.id);
  res.json({
    success: true,
    data,
  });
}

module.exports = {
  subjectUsage,
  contentUsage,
};
