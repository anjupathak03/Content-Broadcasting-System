const { transaction } = require('../config/db');
const contentModel = require('../models/contentModel');
const cacheService = require('./cacheService');
const { CONTENT_STATUSES } = require('../utils/constants');
const { notFound } = require('../utils/errors');
const { serializeContent } = require('../utils/serializers');

async function approveContent({ principal, contentId }) {
  const existing = await contentModel.findContentById(contentId);
  if (!existing) throw notFound('Content not found');

  await transaction(async (client) => {
    return contentModel.setContentStatus(client, {
      contentId,
      status: CONTENT_STATUSES.APPROVED,
      rejectionReason: null,
      approvedBy: principal.id,
      approvedAt: new Date(),
    });
  });

  await cacheService.invalidateTeacherLiveCache(existing.uploaded_by);
  return serializeContent(await contentModel.findContentById(contentId));
}

async function rejectContent({ principal, contentId, reason }) {
  const existing = await contentModel.findContentById(contentId);
  if (!existing) throw notFound('Content not found');

  await transaction(async (client) => {
    return contentModel.setContentStatus(client, {
      contentId,
      status: CONTENT_STATUSES.REJECTED,
      rejectionReason: reason,
      approvedBy: null,
      approvedAt: null,
    });
  });

  await cacheService.invalidateTeacherLiveCache(existing.uploaded_by);
  return serializeContent(await contentModel.findContentById(contentId));
}

module.exports = {
  approveContent,
  rejectContent,
};
