const test = require('node:test');
const assert = require('node:assert/strict');
const { pickActiveSchedule } = require('../src/utils/rotation');

test('returns null for empty schedules', () => {
  assert.equal(pickActiveSchedule([], new Date()), null);
});

test('picks content by duration inside one cycle', () => {
  const start = '2026-04-25T00:00:00.000Z';
  const rows = [
    { content_id: 1, rotation_order: 1, duration_minutes: 5, start_time: start, schedule_id: 1 },
    { content_id: 2, rotation_order: 2, duration_minutes: 10, start_time: start, schedule_id: 2 },
    { content_id: 3, rotation_order: 3, duration_minutes: 5, start_time: start, schedule_id: 3 },
  ];

  assert.equal(pickActiveSchedule(rows, '2026-04-25T00:02:00.000Z').content_id, 1);
  assert.equal(pickActiveSchedule(rows, '2026-04-25T00:07:00.000Z').content_id, 2);
  assert.equal(pickActiveSchedule(rows, '2026-04-25T00:17:00.000Z').content_id, 3);
});

test('loops continuously after total cycle duration', () => {
  const start = '2026-04-25T00:00:00.000Z';
  const rows = [
    { content_id: 1, rotation_order: 1, duration_minutes: 5, start_time: start, schedule_id: 1 },
    { content_id: 2, rotation_order: 2, duration_minutes: 5, start_time: start, schedule_id: 2 },
  ];

  assert.equal(pickActiveSchedule(rows, '2026-04-25T00:12:00.000Z').content_id, 1);
  assert.equal(pickActiveSchedule(rows, '2026-04-25T00:17:00.000Z').content_id, 2);
});
