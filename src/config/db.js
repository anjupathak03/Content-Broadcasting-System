const mysql = require('mysql2/promise');
const config = require('./env');

const pool = mysql.createPool(config.db);

function normalizeResult(result) {
  if (Array.isArray(result)) {
    return {
      rows: result,
      rowCount: result.length,
    };
  }

  return {
    rows: [],
    rowCount: result.affectedRows || 0,
    affectedRows: result.affectedRows || 0,
    insertId: result.insertId || 0,
    warningStatus: result.warningStatus || 0,
  };
}

async function query(sql, params = []) {
  const [result] = await pool.query(sql, params);
  return normalizeResult(result);
}

async function transaction(callback) {
  const connection = await pool.getConnection();
  const client = {
    query: async (sql, params = []) => {
      const [result] = await connection.query(sql, params);
      return normalizeResult(result);
    },
  };

  try {
    await connection.beginTransaction();
    const result = await callback(client);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  transaction,
};
