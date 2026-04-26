const storageService = require('../services/storageService');

function serializeUser(user) {
  if (!user) return null;
  return {
    id: Number(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    public_slug: user.public_slug || null,
    created_at: user.created_at,
  };
}

async function serializeContent(row) {
  if (!row) return null;

  const fileUrl = await storageService.resolveFileUrl({
    fileUrl: row.file_url,
    filePath: row.file_path,
    storageProvider: row.storage_provider,
  });

  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    subject: row.subject,
    file_url: fileUrl,
    storage_provider: row.storage_provider || 'local',
    file_type: row.file_type,
    file_size: Number(row.file_size),
    uploaded_by: Number(row.uploaded_by),
    uploaded_by_name: row.uploaded_by_name || undefined,
    teacher_public_slug: row.teacher_public_slug || undefined,
    status: row.status,
    rejection_reason: row.rejection_reason,
    approved_by: row.approved_by ? Number(row.approved_by) : null,
    approved_by_name: row.approved_by_name || undefined,
    approved_at: row.approved_at,
    start_time: row.start_time,
    end_time: row.end_time,
    rotation_duration_minutes: Number(row.rotation_duration_minutes),
    rotation_order: row.rotation_order ? Number(row.rotation_order) : undefined,
    schedule_duration_minutes: row.schedule_duration_minutes ? Number(row.schedule_duration_minutes) : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function serializeLiveContent(row) {
  if (!row) return null;

  const fileUrl = await storageService.resolveFileUrl({
    fileUrl: row.file_url,
    filePath: row.file_path,
    storageProvider: row.storage_provider,
  });

  return {
    id: Number(row.content_id || row.id),
    title: row.title,
    description: row.description,
    subject: row.subject,
    file_url: fileUrl,
    storage_provider: row.storage_provider || 'local',
    file_type: row.file_type,
    file_size: Number(row.file_size),
    teacher: {
      id: Number(row.teacher_id || row.uploaded_by),
      name: row.teacher_name,
      public_slug: row.teacher_public_slug,
    },
    schedule: {
      start_time: row.start_time,
      end_time: row.end_time,
      rotation_order: Number(row.rotation_order),
      duration_minutes: Number(row.duration_minutes),
    },
  };
}

module.exports = {
  serializeUser,
  serializeContent,
  serializeLiveContent,
};
