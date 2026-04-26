const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateQuery } = require('../middlewares/validate');
const { analyticsQuerySchema } = require('../validators/schemas');
const { ROLES } = require('../utils/constants');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate, authorize(ROLES.PRINCIPAL));
router.get('/subjects', validateQuery(analyticsQuerySchema), asyncHandler(analyticsController.subjectUsage));
router.get('/content/:id', asyncHandler(analyticsController.contentUsage));

module.exports = router;
