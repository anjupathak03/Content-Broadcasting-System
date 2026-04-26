const { query } = require('../config/db');
const { CONTENT_STATUSES } = require('../utils/constants');

async function createContent(client, data) {
  const result = await client.query(
    `
      INSERT INTO contents (
        title,
        description,
        subject,
        file_url,
        file_path,
        file_type,
        file_size,
        storage_provider,
        uploaded_by,
        status,
        start_time,
        end_time,
        rotation_duration_minutes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.title,
      data.description,
      data.subject,
      data.fileUrl,
      data.filePath,
      data.fileType,
      data.fileSize,
      data.storageProvider || 'local',
      data.uploadedBy,
      data.status || CONTENT_STATUSES.PENDING,
      data.startTime,
      data.endTime,
      data.rotationDurationMinutes,
    ]
  );

  const created = await client.query('SELECT * FROM contents WHERE id = ?', [result.insertId]);
  return created.rows[0];
}

async function createSchedule(client, data) {
  const result = await client.query(
    `
      INSERT INTO content_schedules (content_id, slot_id, rotation_order, duration_minutes)
      VALUES (?, ?, ?, ?)
    `,
    [data.contentId, data.slotId, data.rotationOrder, data.durationMinutes]
  );

  const created = await client.query('SELECT * FROM content_schedules WHERE id = ?', [result.insertId]);
  return created.rows[0];
}

async function findContentById(id) {
  const result = await query(
    `
      SELECT
        c.*,
        uploader.name AS uploaded_by_name,
        uploader.public_slug AS teacher_public_slug,
        approver.name AS approved_by_name,
        cs.rotation_order,
        cs.duration_minutes AS schedule_duration_minutes,
        cs.slot_id
      FROM contents c
      JOIN users uploader ON uploader.id = c.uploaded_by
      LEFT JOIN users approver ON approver.id = c.approved_by
      LEFT JOIN content_schedules cs ON cs.content_id = c.id
      WHERE c.id = ?
    `,
    [id]
  );
  return result.rows[0] || null;
}

async function listContents(filters) {
  const { status, subject, teacherId, page, limit } = filters;
  const where = [];
  const params = [];

  if (status) {
    params.push(status);
    where.push('c.status = ?');
  }

  if (subject) {
    params.push(subject);
    where.push('c.subject = ?');
  }

  if (teacherId) {
    params.push(teacherId);
    where.push('c.uploaded_by = ?');
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  params.push(limit, offset);
  const listResult = await query(
    `
      SELECT
        c.*,
        uploader.name AS uploaded_by_name,
        uploader.public_slug AS teacher_public_slug,
        approver.name AS approved_by_name,
        cs.rotation_order,
        cs.duration_minutes AS schedule_duration_minutes
      FROM contents c
      JOIN users uploader ON uploader.id = c.uploaded_by
      LEFT JOIN users approver ON approver.id = c.approved_by
      LEFT JOIN content_schedules cs ON cs.content_id = c.id
      ${whereSql}
      ORDER BY c.created_at DESC, c.id DESC
      LIMIT ? OFFSET ?
    `,
    params
  );

  const countParams = params.slice(0, params.length - 2);
  const countResult = await query(
    `SELECT COUNT(*) AS total FROM contents c ${whereSql}`,
    countParams
  );

  return {
    rows: listResult.rows,
    total: Number(countResult.rows[0].total),
  };
}

async function listTeacherContents(filters) {
  return listContents({ ...filters, teacherId: filters.teacherId });
}

async function setContentStatus(client, data) {
  const result = await client.query(
    `
      UPDATE contents
      SET
        status = ?,
        rejection_reason = ?,
        approved_by = ?,
        approved_at = ?,
        updated_at = CURRENT_TIMESTAMP(3)
      WHERE id = ?
    `,
    [data.status, data.rejectionReason, data.approvedBy, data.approvedAt, data.contentId]
  );

  if (result.affectedRows === 0) return null;
  const updated = await client.query('SELECT * FROM contents WHERE id = ?', [data.contentId]);
  return updated.rows[0] || null;
}

async function updateContentSchedule(client, data) {
  const contentResult = await client.query(
    `
      UPDATE contents
      SET
        start_time = ?,
        end_time = ?,
        rotation_duration_minutes = COALESCE(?, rotation_duration_minutes),
        updated_at = CURRENT_TIMESTAMP(3)
      WHERE id = ?
    `,
    [data.startTime, data.endTime, data.rotationDurationMinutes, data.contentId]
  );

  if (contentResult.affectedRows === 0) return null;

  const scheduleResult = await client.query(
    `
      UPDATE content_schedules
      SET
        duration_minutes = COALESCE(?, duration_minutes),
        rotation_order = COALESCE(?, rotation_order),
        updated_at = CURRENT_TIMESTAMP(3)
      WHERE content_id = ?
    `,
    [data.rotationDurationMinutes, data.rotationOrder, data.contentId]
  );

  const updatedContent = await client.query('SELECT * FROM contents WHERE id = ?', [data.contentId]);
  const updatedSchedule = scheduleResult.affectedRows
    ? await client.query('SELECT * FROM content_schedules WHERE content_id = ?', [data.contentId])
    : { rows: [] };

  return {
    content: updatedContent.rows[0],
    schedule: updatedSchedule.rows[0] || null,
  };
}

async function listLiveScheduleRows({ teacherId, subject, now }) {
  const params = [teacherId, now, now];
  let subjectSql = '';

  if (subject) {
    params.push(subject);
    subjectSql = 'AND c.subject = ?';
  }

  const result = await query(
    `
      SELECT
        c.id AS content_id,
        c.title,
        c.description,
        c.subject,
        c.file_url,
        c.file_path,
        c.storage_provider,
        c.file_type,
        c.file_size,
        c.uploaded_by,
        c.start_time,
        c.end_time,
        u.id AS teacher_id,
        u.name AS teacher_name,
        u.public_slug AS teacher_public_slug,
        slot.id AS slot_id,
        slot.created_at AS slot_created_at,
        schedule.id AS schedule_id,
        schedule.rotation_order,
        schedule.duration_minutes
      FROM contents c
      JOIN users u ON u.id = c.uploaded_by
      JOIN content_schedules schedule ON schedule.content_id = c.id
      JOIN content_slots slot ON slot.id = schedule.slot_id
      WHERE c.uploaded_by = ?
        AND c.status = 'approved'
        AND c.start_time IS NOT NULL
        AND c.end_time IS NOT NULL
        AND c.start_time <= ?
        AND c.end_time >= ?
        AND slot.teacher_id = c.uploaded_by
        AND slot.subject = c.subject
        ${subjectSql}
      ORDER BY c.subject ASC, schedule.rotation_order ASC, schedule.id ASC
    `,
    params
  );

  return result.rows;
}

async function createBroadcastEvent({ contentId, teacherId, subject }) {
  await query(
    `
      INSERT INTO content_broadcast_events (content_id, teacher_id, subject)
      VALUES (?, ?, ?)
    `,
    [contentId, teacherId, subject]
  );
}

module.exports = {
  createContent,
  createSchedule,
  findContentById,
  listContents,
  listTeacherContents,
  setContentStatus,
  updateContentSchedule,
  listLiveScheduleRows,
  createBroadcastEvent,
};
