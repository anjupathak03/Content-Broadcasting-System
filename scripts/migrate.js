const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

async function ensureMigrationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      executed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function hasMigrationRun(filename) {
  const result = await pool.query('SELECT 1 FROM schema_migrations WHERE filename = ?', [filename]);
  return result.rowCount > 0;
}

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let quote = null;
  let escaped = false;

  for (const char of sql) {
    current += char;

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }

    if (char === ';') {
      const statement = current.slice(0, -1).trim();
      if (statement) statements.push(statement);
      current = '';
    }
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

async function run() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  await ensureMigrationTable();

  for (const file of files) {
    if (await hasMigrationRun(file)) {
      console.log(`Skipping ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running ${file}`);
    for (const statement of splitSqlStatements(sql)) {
      await pool.query(statement);
    }
    await pool.query('INSERT IGNORE INTO schema_migrations (filename) VALUES (?)', [file]);
  }

  console.log('Migrations complete');
}

run()
  .catch((error) => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
