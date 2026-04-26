const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const { loginSchema } = require('../validators/schemas');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/login', validateBody(loginSchema), asyncHandler(authController.login));
router.get('/me', authenticate, asyncHandler(authController.me));

module.exports = router;
