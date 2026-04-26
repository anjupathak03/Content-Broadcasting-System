const { query } = require('../config/db');
const { ROLES } = require('../utils/constants');

async function findByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = ?', [email]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query('SELECT * FROM users WHERE id = ?', [id]);
  return result.rows[0] || null;
}

async function findTeacherByKey(key) {
  const normalizedKey = String(key || '').trim().toLowerCase();
  const numericId = normalizedKey.match(/^teacher-(\d+)$/)?.[1] || (/^\d+$/.test(normalizedKey) ? normalizedKey : null);
  const params = [ROLES.TEACHER, normalizedKey];
  const idSql = numericId ? ' OR id = ?' : '';

  if (numericId) {
    params.push(Number(numericId));
  }

  const result = await query(
    `
      SELECT *
      FROM users
      WHERE role = ?
        AND (public_slug = ?${idSql})
      LIMIT 1
    `,
    params
  );

  return result.rows[0] || null;
}

async function findSummaryById(client, id) {
  const result = await client.query(
    `
      SELECT id, name, email, role, public_slug, created_at
      FROM users
      WHERE id = ?
    `,
    [id]
  );
  return result.rows[0] || null;
}

async function createUser(client, { name, email, passwordHash, role }) {
  const result = await client.query(
    `
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `,
    [name, email, passwordHash, role]
  );

  const user = await findSummaryById(client, result.insertId);

  if (role === ROLES.TEACHER && !user.public_slug) {
    await client.query(
      `
        UPDATE users
        SET public_slug = ?, updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [`teacher-${user.id}`, user.id]
    );
    return findSummaryById(client, user.id);
  }

  return user;
}

async function listUsers({ role, page, limit }) {
  const where = [];
  const params = [];

  if (role) {
    params.push(role);
    where.push('role = ?');
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  params.push(limit, offset);
  const listResult = await query(
    `
      SELECT id, name, email, role, public_slug, created_at
      FROM users
      ${whereSql}
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?
    `,
    params
  );

  const countParams = params.slice(0, params.length - 2);
  const countResult = await query(`SELECT COUNT(*) AS total FROM users ${whereSql}`, countParams);

  return {
    rows: listResult.rows,
    total: Number(countResult.rows[0].total),
  };
}

module.exports = {
  findByEmail,
  findById,
  findTeacherByKey,
  createUser,
  listUsers,
};
