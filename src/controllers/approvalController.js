const approvalService = require('../services/approvalService');

async function approve(req, res) {
  const content = await approvalService.approveContent({
    principal: req.user,
    contentId: req.params.id,
  });

  res.json({
    success: true,
    message: 'Content approved',
    data: content,
  });
}

async function reject(req, res) {
  const content = await approvalService.rejectContent({
    principal: req.user,
    contentId: req.params.id,
    reason: req.body.reason,
  });

  res.json({
    success: true,
    message: 'Content rejected',
    data: content,
  });
}

module.exports = {
  approve,
  reject,
};
