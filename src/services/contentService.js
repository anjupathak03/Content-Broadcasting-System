const config = require('../config/env');
const { transaction } = require('../config/db');
const contentModel = require('../models/contentModel');
const slotModel = require('../models/slotModel');
const cacheService = require('./cacheService');
const storageService = require('./storageService');
const { CONTENT_STATUSES, ROLES } = require('../utils/constants');
const { badRequest, forbidden, notFound } = require('../utils/errors');
const { normalizeSubject, parseOptionalDate, parsePositiveInteger } = require('../utils/normalizers');
const { serializeContent } = require('../utils/serializers');

function validateScheduleWindow(startTime, endTime) {
  if (startTime && endTime && endTime <= startTime) {
    throw badRequest('end_time must be later than start_time');
  }
}

function normalizeUploadBody(body) {
  const title = String(body.title || '').trim();
  const subject = normalizeSubject(body.subject);
  const description = body.description ? String(body.description).trim() : null;
  const startTime = parseOptionalDate(body.start_time);
  const endTime = parseOptionalDate(body.end_time);
  const rotationProvided =
    body.rotation_duration_minutes !== undefined &&
    body.rotation_duration_minutes !== null &&
    body.rotation_duration_minutes !== '';
  const rotationDurationMinutes = rotationProvided
    ? parsePositiveInteger(body.rotation_duration_minutes)
    : config.defaultRotationMinutes;

  if (!title) throw badRequest('Title is required');
  if (!subject) throw badRequest('Subject is required');

  if (body.start_time && !startTime) throw badRequest('Invalid start_time');
  if (body.end_time && !endTime) throw badRequest('Invalid end_time');
  if (!rotationDurationMinutes) throw badRequest('rotation_duration_minutes must be a positive integer');

  validateScheduleWindow(startTime, endTime);

  return {
    title,
    subject,
    description,
    startTime,
    endTime,
    rotationDurationMinutes,
  };
}

async function uploadContent({ teacher, file, body }) {
  let storedFile;

  try {
    const normalized = normalizeUploadBody(body);
    storedFile = await storageService.persistContentFile(file);

    const created = await transaction(async (client) => {
      const slot = await slotModel.getOrCreateSlot(client, {
        teacherId: teacher.id,
        subject: normalized.subject,
      });

      const nextRotationOrder = await slotModel.getNextRotationOrder(client, slot.id);

      const content = await contentModel.createContent(client, {
        title: normalized.title,
        description: normalized.description,
        subject: normalized.subject,
        fileUrl: storedFile.fileUrl,
        filePath: storedFile.filePath,
        storageProvider: storedFile.storageProvider,
        fileType: storedFile.fileType,
        fileSize: storedFile.fileSize,
        uploadedBy: teacher.id,
        status: CONTENT_STATUSES.PENDING,
        startTime: normalized.startTime,
        endTime: normalized.endTime,
        rotationDurationMinutes: normalized.rotationDurationMinutes,
      });

      const schedule = await contentModel.createSchedule(client, {
        contentId: content.id,
        slotId: slot.id,
        rotationOrder: nextRotationOrder,
        durationMinutes: normalized.rotationDurationMinutes,
      });

      return {
        ...content,
        rotation_order: schedule.rotation_order,
        schedule_duration_minutes: schedule.duration_minutes,
      };
    });

    await cacheService.invalidateTeacherLiveCache(teacher.id);
    return serializeContent(created);
  } catch (error) {
    try {
      await storageService.deleteStoredFile(storedFile || file?.path);
    } catch (cleanupError) {
      console.error('Failed to clean up uploaded file:', cleanupError.message);
    }
    throw error;
  }
}

async function getContentByIdForUser(contentId, user) {
  const content = await contentModel.findContentById(contentId);
  if (!content) throw notFound('Content not found');

  if (user.role === ROLES.TEACHER && Number(content.uploaded_by) !== Number(user.id)) {
    throw forbidden('You can only access your own content');
  }

  return serializeContent(content);
}

async function listAllContent(filters) {
  const result = await contentModel.listContents(filters);
  return {
    data: await Promise.all(result.rows.map(serializeContent)),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit),
    },
  };
}

async function listTeacherContent(teacherId, filters) {
  const result = await contentModel.listTeacherContents({ ...filters, teacherId });
  return {
    data: await Promise.all(result.rows.map(serializeContent)),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit),
    },
  };
}

async function updateSchedule({ teacher, contentId, payload }) {
  const content = await contentModel.findContentById(contentId);
  if (!content) throw notFound('Content not found');

  if (Number(content.uploaded_by) !== Number(teacher.id)) {
    throw forbidden('You can only update your own content schedule');
  }

  const nextStartTime = payload.start_time === undefined
    ? content.start_time
    : payload.start_time === null
      ? null
      : new Date(payload.start_time);

  const nextEndTime = payload.end_time === undefined
    ? content.end_time
    : payload.end_time === null
      ? null
      : new Date(payload.end_time);

  validateScheduleWindow(
    nextStartTime ? new Date(nextStartTime) : null,
    nextEndTime ? new Date(nextEndTime) : null
  );

  await transaction(async (client) => {
    return contentModel.updateContentSchedule(client, {
      contentId,
      startTime: nextStartTime,
      endTime: nextEndTime,
      rotationDurationMinutes: payload.rotation_duration_minutes,
      rotationOrder: payload.rotation_order,
    });
  });

  await cacheService.invalidateTeacherLiveCache(teacher.id);
  return getContentByIdForUser(contentId, teacher);
}

module.exports = {
  uploadContent,
  getContentByIdForUser,
  listAllContent,
  listTeacherContent,
  updateSchedule,
};
