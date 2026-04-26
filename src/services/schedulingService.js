const userModel = require('../models/userModel');
const contentModel = require('../models/contentModel');
const cacheService = require('./cacheService');
const { pickActiveSchedule } = require('../utils/rotation');
const { normalizeSubject } = require('../utils/normalizers');
const { serializeLiveContent } = require('../utils/serializers');

function noContentResponse(teacher = null, subject = null) {
  return {
    success: true,
    message: 'No content available',
    data: null,
    meta: {
      teacher: teacher
        ? {
            id: Number(teacher.id),
            name: teacher.name,
            public_slug: teacher.public_slug,
          }
        : null,
      subject: subject || null,
    },
  };
}

function groupBySubject(rows) {
  return rows.reduce((groups, row) => {
    if (!groups[row.subject]) groups[row.subject] = [];
    groups[row.subject].push(row);
    return groups;
  }, {});
}

async function recordBroadcastEvents(rows) {
  for (const row of rows) {
    await contentModel.createBroadcastEvent({
      contentId: row.content_id,
      teacherId: row.teacher_id,
      subject: row.subject,
    });
  }
}

function liveCacheKey(teacherId, subject) {
  return `live:${teacherId}:${subject || 'all'}`;
}

async function getLiveContent({ teacherKey, subject }) {
  const normalizedSubject = subject ? normalizeSubject(subject) : null;
  const teacher = await userModel.findTeacherByKey(teacherKey);

  if (!teacher) {
    return noContentResponse(null, normalizedSubject);
  }

  const cacheKey = liveCacheKey(teacher.id, normalizedSubject);
  const cached = await cacheService.getJson(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const rows = await contentModel.listLiveScheduleRows({
    teacherId: teacher.id,
    subject: normalizedSubject,
    now,
  });

  if (rows.length === 0) {
    const response = noContentResponse(teacher, normalizedSubject);
    await cacheService.setJson(cacheKey, response);
    return response;
  }

  let selectedRows;
  let response;

  if (normalizedSubject) {
    const selected = pickActiveSchedule(rows, now);
    if (!selected) {
      response = noContentResponse(teacher, normalizedSubject);
      await cacheService.setJson(cacheKey, response);
      return response;
    }

    selectedRows = [selected];
    response = {
      success: true,
      message: 'Live content found',
      data: await serializeLiveContent(selected),
      meta: {
        teacher: {
          id: Number(teacher.id),
          name: teacher.name,
          public_slug: teacher.public_slug,
        },
        subject: normalizedSubject,
      },
    };
  } else {
    const groups = groupBySubject(rows);
    selectedRows = Object.values(groups)
      .map((group) => pickActiveSchedule(group, now))
      .filter(Boolean);

    if (selectedRows.length === 0) {
      response = noContentResponse(teacher, null);
      await cacheService.setJson(cacheKey, response);
      return response;
    }

    const liveData = await Promise.all(selectedRows.map(serializeLiveContent));

    response = {
      success: true,
      message: 'Live content found',
      data: liveData,
      meta: {
        teacher: {
          id: Number(teacher.id),
          name: teacher.name,
          public_slug: teacher.public_slug,
        },
        subject: null,
        subjects_returned: selectedRows.map((row) => row.subject),
      },
    };
  }

  await recordBroadcastEvents(selectedRows);
  await cacheService.setJson(cacheKey, response);
  return response;
}

module.exports = {
  getLiveContent,
};
