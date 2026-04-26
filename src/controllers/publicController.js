const schedulingService = require('../services/schedulingService');

async function getLiveContent(req, res) {
  const result = await schedulingService.getLiveContent({
    teacherKey: req.params.teacherKey,
    subject: req.query.subject,
  });

  res.set('Cache-Control', 'public, max-age=10');
  res.json(result);
}

module.exports = {
  getLiveContent,
};
