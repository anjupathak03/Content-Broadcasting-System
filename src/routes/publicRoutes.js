const express = require('express');
const publicController = require('../controllers/publicController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/:teacherKey', asyncHandler(publicController.getLiveContent));

module.exports = router;
