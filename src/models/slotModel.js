async function getOrCreateSlot(client, { teacherId, subject }) {
  const result = await client.query(
    `
      INSERT INTO content_slots (teacher_id, subject)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        id = LAST_INSERT_ID(id),
        subject = VALUES(subject)
    `,
    [teacherId, subject]
  );

  const slotResult = await client.query('SELECT * FROM content_slots WHERE id = ?', [result.insertId]);
  return slotResult.rows[0];
}

async function getNextRotationOrder(client, slotId) {
  const result = await client.query(
    'SELECT COALESCE(MAX(rotation_order), 0) + 1 AS next_order FROM content_schedules WHERE slot_id = ?',
    [slotId]
  );
  return Number(result.rows[0].next_order);
}

module.exports = {
  getOrCreateSlot,
  getNextRotationOrder,
};
