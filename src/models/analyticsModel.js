const { query } = require('../config/db');

function buildDateWhere({ from, to }) {
  const where = [];
  const params = [];

  if (from) {
    params.push(from);
    where.push('requested_at >= ?');
  }

  if (to) {
    params.push(to);
    where.push('requested_at <= ?');
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
}

async function subjectUsage({ from, to }) {
  const { whereSql, params } = buildDateWhere({ from, to });
  const result = await query(
    `
      SELECT
        subject,
        COUNT(*) AS total_hits,
        COUNT(DISTINCT content_id) AS distinct_content_count,
        MAX(requested_at) AS latest_hit_at
      FROM content_broadcast_events
      ${whereSql}
      GROUP BY subject
      ORDER BY total_hits DESC, subject ASC
    `,
    params
  );
  return result.rows;
}

async function contentUsage(contentId) {
  const result = await query(
    `
      SELECT
        c.id,
        c.title,
        c.subject,
        COUNT(e.id) AS total_hits,
        MAX(e.requested_at) AS latest_hit_at
      FROM contents c
      LEFT JOIN content_broadcast_events e ON e.content_id = c.id
      WHERE c.id = ?
      GROUP BY c.id, c.title, c.subject
    `,
    [contentId]
  );
  return result.rows[0] || null;
}

module.exports = {
  subjectUsage,
  contentUsage,
};
