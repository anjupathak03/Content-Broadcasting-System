const Redis = require('ioredis');
const config = require('../config/env');

let redis = null;

if (config.redisUrl) {
  redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
  });

  redis.on('error', (error) => {
    console.error('Redis error:', error.message);
  });
}

async function getJson(key) {
  if (!redis) return null;
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

async function setJson(key, value, ttlSeconds = config.liveCacheTtlSeconds) {
  if (!redis) return;
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

async function deleteByPattern(pattern) {
  if (!redis) return;
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } while (cursor !== '0');
}

async function invalidateTeacherLiveCache(teacherId) {
  await deleteByPattern(`live:${teacherId}:*`);
}

function isEnabled() {
  return Boolean(redis);
}

module.exports = {
  getJson,
  setJson,
  invalidateTeacherLiveCache,
  isEnabled,
};
