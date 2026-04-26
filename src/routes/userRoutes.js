const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateBody, validateQuery } = require('../middlewares/validate');
const { createUserSchema, listUsersQuerySchema } = require('../validators/schemas');
const { ROLES } = require('../utils/constants');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate, authorize(ROLES.PRINCIPAL));
router.post('/', validateBody(createUserSchema), asyncHandler(userController.createUser));
router.get('/', validateQuery(listUsersQuerySchema), asyncHandler(userController.listUsers));

module.exports = router;
