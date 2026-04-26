const ROLES = Object.freeze({
  PRINCIPAL: 'principal',
  TEACHER: 'teacher',
});

const CONTENT_STATUSES = Object.freeze({
  UPLOADED: 'uploaded',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

const ALLOWED_IMAGE_MIME_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/gif']);
const ALLOWED_IMAGE_EXTENSIONS = Object.freeze(['.jpg', '.jpeg', '.png', '.gif']);

module.exports = {
  ROLES,
  CONTENT_STATUSES,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_IMAGE_EXTENSIONS,
};
