const { z } = require('zod');
const { CONTENT_STATUSES, ROLES } = require('../utils/constants');

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1),
});

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(120),
  role: z.enum([ROLES.PRINCIPAL, ROLES.TEACHER]),
});

const listUsersQuerySchema = z.object({
  role: z.enum([ROLES.PRINCIPAL, ROLES.TEACHER]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const rejectContentSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

const listContentQuerySchema = z.object({
  status: z.enum(Object.values(CONTENT_STATUSES)).optional(),
  subject: z.string().trim().min(1).max(80).optional(),
  teacher_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const teacherContentQuerySchema = z.object({
  status: z.enum(Object.values(CONTENT_STATUSES)).optional(),
  subject: z.string().trim().min(1).max(80).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const scheduleUpdateSchema = z.object({
  start_time: z.string().datetime({ offset: true }).nullable().optional(),
  end_time: z.string().datetime({ offset: true }).nullable().optional(),
  rotation_duration_minutes: z.coerce.number().int().positive().max(1440).optional(),
  rotation_order: z.coerce.number().int().positive().optional(),
});

const analyticsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

module.exports = {
  loginSchema,
  createUserSchema,
  listUsersQuerySchema,
  rejectContentSchema,
  listContentQuerySchema,
  teacherContentQuerySchema,
  scheduleUpdateSchema,
  analyticsQuerySchema,
};
