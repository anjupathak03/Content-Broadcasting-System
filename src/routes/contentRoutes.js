const express = require('express');
const contentController = require('../controllers/contentController');
const approvalController = require('../controllers/approvalController');
const { authenticate, authorize } = require('../middlewares/auth');
const { handleContentUpload } = require('../middlewares/upload');
const { validateBody, validateQuery } = require('../middlewares/validate');
const {
  listContentQuerySchema,
  teacherContentQuerySchema,
  rejectContentSchema,
  scheduleUpdateSchema,
} = require('../validators/schemas');
const { ROLES } = require('../utils/constants');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize(ROLES.TEACHER),
  handleContentUpload,
  asyncHandler(contentController.uploadContent)
);

router.get(
  '/mine',
  authenticate,
  authorize(ROLES.TEACHER),
  validateQuery(teacherContentQuerySchema),
  asyncHandler(contentController.listMine)
);

router.get(
  '/pending',
  authenticate,
  authorize(ROLES.PRINCIPAL),
  validateQuery(listContentQuerySchema.partial({ status: true })),
  asyncHandler(contentController.listPending)
);

router.get(
  '/',
  authenticate,
  authorize(ROLES.PRINCIPAL),
  validateQuery(listContentQuerySchema),
  asyncHandler(contentController.listAll)
);

router.get('/:id', authenticate, asyncHandler(contentController.getById));

router.patch(
  '/:id/schedule',
  authenticate,
  authorize(ROLES.TEACHER),
  validateBody(scheduleUpdateSchema),
  asyncHandler(contentController.updateSchedule)
);

router.patch(
  '/:id/approve',
  authenticate,
  authorize(ROLES.PRINCIPAL),
  asyncHandler(approvalController.approve)
);

router.patch(
  '/:id/reject',
  authenticate,
  authorize(ROLES.PRINCIPAL),
  validateBody(rejectContentSchema),
  asyncHandler(approvalController.reject)
);

module.exports = router;
