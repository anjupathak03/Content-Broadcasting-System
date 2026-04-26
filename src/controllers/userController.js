const authService = require('../services/authService');
const userService = require('../services/userService');

async function createUser(req, res) {
  const user = await authService.createUser(req.body);
  res.status(201).json({
    success: true,
    message: 'User created',
    data: user,
  });
}

async function listUsers(req, res) {
  const result = await userService.listUsers(req.query);
  res.json({
    success: true,
    ...result,
  });
}

module.exports = {
  createUser,
  listUsers,
};
