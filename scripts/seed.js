const bcrypt = require('bcryptjs');
const { pool, transaction } = require('../src/config/db');

const users = [
  {
    name: 'Principal',
    email: 'principal@content-broadcasting-system.local',
    password: 'Principal@123',
    role: 'principal',
    public_slug: null,
  },
  {
    name: 'Teacher One',
    email: 'teacher1@content-broadcasting-system.local',
    password: 'Teacher@123',
    role: 'teacher',
    public_slug: 'teacher-1',
  },
  {
    name: 'Teacher Two',
    email: 'teacher2@content-broadcasting-system.local',
    password: 'Teacher@123',
    role: 'teacher',
    public_slug: 'teacher-2',
  },
  {
    name: 'Teacher Three',
    email: 'teacher3@content-broadcasting-system.local',
    password: 'Teacher@123',
    role: 'teacher',
    public_slug: 'teacher-3',
  },
];

async function upsertUser(client, user) {
  const passwordHash = await bcrypt.hash(user.password, 12);
  const result = await client.query(
    `
      INSERT INTO users (name, email, password_hash, role, public_slug)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        id = LAST_INSERT_ID(id),
        name = VALUES(name),
        password_hash = VALUES(password_hash),
        role = VALUES(role),
        public_slug = COALESCE(VALUES(public_slug), public_slug),
        updated_at = CURRENT_TIMESTAMP(3)
    `,
    [user.name, user.email, passwordHash, user.role, user.public_slug]
  );

  const selected = await client.query(
    'SELECT id, name, email, role, public_slug, created_at FROM users WHERE id = ?',
    [result.insertId]
  );
  return selected.rows[0];
}

async function run() {
  const seeded = await transaction(async (client) => {
    const rows = [];
    for (const user of users) {
      rows.push(await upsertUser(client, user));
    }
    return rows;
  });

  console.table(
    seeded.map((user) => ({
      id: user.id,
      role: user.role,
      email: user.email,
      public_slug: user.public_slug || '-',
    }))
  );
}

run()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
