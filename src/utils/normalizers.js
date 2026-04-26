function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeSubject(subject) {
  return String(subject || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function parsePositiveInteger(value, fallback = undefined) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseOptionalDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function buildFileUrl(publicBaseUrl, fileUrl) {
  if (!fileUrl) return fileUrl;
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  return `${publicBaseUrl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}

module.exports = {
  normalizeEmail,
  normalizeSubject,
  parsePositiveInteger,
  parseOptionalDate,
  buildFileUrl,
};
