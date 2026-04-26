const authService = require('../services/authService');
const { serializeUser } = require('../utils/serializers');

async function login(req, res) {
  const result = await authService.login(req.body);
  res.json({
    success: true,
    message: 'Login successful',
    data: result,
  });
}

async function me(req, res) {
  res.json({
    success: true,
    data: serializeUser(req.user),
  });
}

module.exports = {
  login,
  me,
};
