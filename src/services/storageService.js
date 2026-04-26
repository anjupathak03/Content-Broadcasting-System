const path = require('path');
const crypto = require('crypto');
const fs = require('fs/promises');
const config = require('../config/env');
const { badRequest } = require('../utils/errors');
const { buildFileUrl } = require('../utils/normalizers');

let s3Client;
let s3Commands;
let s3Presigner;

function getS3Dependencies() {
  if (!s3Commands) {
    s3Commands = require('@aws-sdk/client-s3');
  }
  return s3Commands;
}

function getS3Presigner() {
  if (!s3Presigner) {
    s3Presigner = require('@aws-sdk/s3-request-presigner');
  }
  return s3Presigner;
}

function getS3Client() {
  if (!s3Client) {
    const { S3Client } = getS3Dependencies();
    s3Client = new S3Client({
      region: config.s3.region,
      ...(config.s3.endpoint ? { endpoint: config.s3.endpoint } : {}),
      ...(config.s3.forcePathStyle ? { forcePathStyle: true } : {}),
      ...(config.s3.credentials ? { credentials: config.s3.credentials } : {}),
    });
  }

  return s3Client;
}

function assertS3Configured() {
  if (!config.s3.bucket) {
    throw badRequest('AWS_S3_BUCKET is required when STORAGE_DRIVER=s3');
  }

  if (!config.s3.region) {
    throw badRequest('AWS_REGION is required when STORAGE_DRIVER=s3');
  }
}

function encodeS3Key(key) {
  return String(key || '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

function buildObjectKey(file) {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const name = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${extension}`;
  return [config.s3.prefix, name].filter(Boolean).join('/');
}

function buildS3InternalUrl(bucket, key) {
  return `s3://${bucket}/${key}`;
}

function parseS3InternalUrl(fileUrl) {
  if (!fileUrl || !String(fileUrl).startsWith('s3://')) return null;

  const withoutScheme = String(fileUrl).slice('s3://'.length);
  const slashIndex = withoutScheme.indexOf('/');
  if (slashIndex === -1) return null;

  return {
    bucket: withoutScheme.slice(0, slashIndex),
    key: withoutScheme.slice(slashIndex + 1),
  };
}

function buildS3PublicUrl(key) {
  const encodedKey = encodeS3Key(key);

  if (config.s3.publicBaseUrl) {
    return `${config.s3.publicBaseUrl}/${encodedKey}`;
  }

  if (config.s3.region === 'us-east-1') {
    return `https://${config.s3.bucket}.s3.amazonaws.com/${encodedKey}`;
  }

  return `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${encodedKey}`;
}

function getLocalFileMetadata(file) {
  if (!file?.path) {
    throw badRequest('Local uploaded file path is missing');
  }

  const fileName = path.basename(file.path);
  const relativePath = path.relative(config.rootDir, file.path).replace(/\\/g, '/');

  return {
    storageProvider: 'local',
    fileUrl: `/uploads/${fileName}`,
    filePath: relativePath,
    fileType: file.mimetype,
    fileSize: file.size,
    cleanupPath: file.path,
  };
}

async function uploadToS3(file) {
  assertS3Configured();

  if (!file?.buffer) {
    throw badRequest('File buffer is missing for S3 upload');
  }

  const { PutObjectCommand } = getS3Dependencies();
  const key = buildObjectKey(file);
  const putParams = {
    Bucket: config.s3.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ContentLength: file.size,
  };

  if (config.s3.acl) {
    putParams.ACL = config.s3.acl;
  }

  await getS3Client().send(new PutObjectCommand(putParams));

  return {
    storageProvider: 's3',
    fileUrl: buildS3InternalUrl(config.s3.bucket, key),
    filePath: key,
    fileType: file.mimetype,
    fileSize: file.size,
    bucket: config.s3.bucket,
    key,
  };
}

async function persistContentFile(file) {
  if (!file) {
    throw badRequest('File is required');
  }

  if (config.storageDriver === 's3') {
    return uploadToS3(file);
  }

  return getLocalFileMetadata(file);
}

async function deleteLocalFile(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function deleteS3Object({ bucket = config.s3.bucket, key }) {
  if (!bucket || !key) return;

  const { DeleteObjectCommand } = getS3Dependencies();
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

async function deleteStoredFile(storedFileOrPath) {
  if (!storedFileOrPath) return;

  if (typeof storedFileOrPath === 'string') {
    await deleteLocalFile(storedFileOrPath);
    return;
  }

  if (storedFileOrPath.storageProvider === 's3' || storedFileOrPath.storage_driver === 's3') {
    const parsed = parseS3InternalUrl(storedFileOrPath.fileUrl);
    await deleteS3Object({
      bucket: storedFileOrPath.bucket || parsed?.bucket || config.s3.bucket,
      key: storedFileOrPath.key || storedFileOrPath.filePath || parsed?.key,
    });
    return;
  }

  await deleteLocalFile(storedFileOrPath.cleanupPath || storedFileOrPath.filePath);
}

async function createSignedReadUrl(bucket, key) {
  const { GetObjectCommand } = getS3Dependencies();
  const { getSignedUrl } = getS3Presigner();

  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: config.s3.signedUrlExpiresSeconds }
  );
}

async function resolveFileUrl({ fileUrl, filePath, storageProvider }) {
  if (storageProvider !== 's3') {
    return buildFileUrl(config.publicBaseUrl, fileUrl);
  }

  assertS3Configured();

  const parsed = parseS3InternalUrl(fileUrl);
  const bucket = parsed?.bucket || config.s3.bucket;
  const key = filePath || parsed?.key;

  if (!key) {
    return fileUrl;
  }

  if (config.s3.signedUrls) {
    return createSignedReadUrl(bucket, key);
  }

  return buildS3PublicUrl(key);
}

module.exports = {
  persistContentFile,
  deleteStoredFile,
  resolveFileUrl,
  buildS3PublicUrl,
};
