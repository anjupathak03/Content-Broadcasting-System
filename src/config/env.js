const path = require('path');
require('dotenv').config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'y', 'on'].includes(String(value).trim().toLowerCase());
};

const toSslConfig = (value) => {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'require', 'required'].includes(normalized)) {
    return { rejectUnauthorized: true };
  }
  if (['0', 'false', 'no', 'disabled'].includes(normalized)) {
    return undefined;
  }
  return undefined;
};

const trimSlashes = (value) => String(value || '').trim().replace(/^\/+|\/+$/g, '');
const pick = (...values) => values.find((value) => value !== undefined && value !== null && value !== '') || '';
const parseDatabaseUrl = (connectionString) => {
  const url = new URL(connectionString);

  if (!['mysql:', 'mysql2:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must use a mysql:// or mysql2:// connection string');
  }

  return {
    host: url.hostname,
    port: toNumber(url.port, 3306),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: toSslConfig(url.searchParams.get('ssl') || url.searchParams.get('sslmode')),
  };
};

const rootDir = path.resolve(__dirname, '..', '..');
const storageDriver = String(process.env.STORAGE_DRIVER || process.env.FILE_STORAGE || 'local').trim().toLowerCase();

if (!['local', 's3'].includes(storageDriver)) {
  throw new Error('STORAGE_DRIVER must be either local or s3');
}

const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
const awsSessionToken = process.env.AWS_SESSION_TOKEN || '';

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 4000),
  publicBaseUrl: (
    process.env.PUBLIC_BASE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${process.env.PORT || 4000}`
  ).replace(/\/$/, ''),
  jwtSecret: process.env.JWT_SECRET || 'development-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  storageDriver,
  uploadDir: process.env.UPLOAD_DIR || 'uploads/content',
  maxFileSizeMb: toNumber(process.env.MAX_FILE_SIZE_MB, 10),
  defaultRotationMinutes: toNumber(process.env.DEFAULT_ROTATION_MINUTES, 5),
  publicRateLimitPerMinute: toNumber(process.env.PUBLIC_RATE_LIMIT_PER_MINUTE, 60),
  redisUrl: process.env.REDIS_URL || '',
  liveCacheTtlSeconds: toNumber(process.env.LIVE_CACHE_TTL_SECONDS, 15),
  s3: {
    bucket: pick(process.env.AWS_S3_BUCKET, process.env.S3_BUCKET),
    region: pick(process.env.AWS_REGION, process.env.AWS_DEFAULT_REGION) || 'ap-south-1',
    prefix: trimSlashes(pick(process.env.AWS_S3_PREFIX, process.env.S3_PREFIX) || 'content-broadcasting-system-content'),
    publicBaseUrl: pick(process.env.AWS_S3_PUBLIC_BASE_URL, process.env.S3_PUBLIC_BASE_URL).replace(/\/$/, ''),
    endpoint: pick(process.env.AWS_S3_ENDPOINT, process.env.S3_ENDPOINT),
    forcePathStyle: toBoolean(pick(process.env.AWS_S3_FORCE_PATH_STYLE, process.env.S3_FORCE_PATH_STYLE), false),
    acl: pick(process.env.AWS_S3_ACL, process.env.S3_ACL),
    signedUrls: toBoolean(pick(process.env.AWS_S3_SIGNED_URLS, process.env.S3_SIGNED_URLS), true),
    signedUrlExpiresSeconds: toNumber(pick(process.env.AWS_S3_SIGNED_URL_EXPIRES_SECONDS, process.env.S3_SIGNED_URL_EXPIRES_SECONDS), 900),
    credentials:
      awsAccessKeyId && awsSecretAccessKey
        ? {
            accessKeyId: awsAccessKeyId,
            secretAccessKey: awsSecretAccessKey,
            ...(awsSessionToken ? { sessionToken: awsSessionToken } : {}),
          }
        : undefined,
  },
  rootDir,
};

config.uploadAbsoluteDir = path.isAbsolute(config.uploadDir)
  ? config.uploadDir
  : path.join(rootDir, config.uploadDir);

config.db = process.env.DATABASE_URL
  ? parseDatabaseUrl(process.env.DATABASE_URL)
  : {
      host: process.env.MYSQLHOST || process.env.MYSQL_HOST || 'localhost',
      port: toNumber(process.env.MYSQLPORT || process.env.MYSQL_PORT, 3306),
      database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'content_broadcasting_system',
      user: process.env.MYSQLUSER || process.env.MYSQL_USER || 'content_user',
      password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || 'content_password',
      ssl: toSslConfig(process.env.MYSQL_SSL || process.env.MYSQLSSL),
    };

config.db = {
  ...config.db,
  waitForConnections: true,
  connectionLimit: toNumber(process.env.DB_CONNECTION_LIMIT, 10),
  timezone: 'Z',
  charset: 'utf8mb4_unicode_ci',
};

module.exports = config;
