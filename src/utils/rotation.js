function pickActiveSchedule(rows, now = new Date()) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const normalizedRows = rows
    .filter((row) => Number(row.duration_minutes) > 0)
    .sort((a, b) => {
      const orderA = Number(a.rotation_order) || 0;
      const orderB = Number(b.rotation_order) || 0;
      if (orderA !== orderB) return orderA - orderB;
      return Number(a.schedule_id || a.id || 0) - Number(b.schedule_id || b.id || 0);
    });

  if (normalizedRows.length === 0) return null;

  const cycleMs = normalizedRows.reduce((sum, row) => sum + Number(row.duration_minutes) * 60 * 1000, 0);
  if (cycleMs <= 0) return normalizedRows[0];

  const anchorCandidates = normalizedRows
    .map((row) => row.start_time || row.slot_created_at || row.created_at)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  const anchorMs = anchorCandidates.length > 0 ? Math.min(...anchorCandidates) : 0;
  const nowMs = new Date(now).getTime();
  const elapsedMs = Math.max(0, nowMs - anchorMs);
  let offset = elapsedMs % cycleMs;

  for (const row of normalizedRows) {
    const durationMs = Number(row.duration_minutes) * 60 * 1000;
    if (offset < durationMs) return row;
    offset -= durationMs;
  }

  return normalizedRows[0];
}

module.exports = {
  pickActiveSchedule,
};
