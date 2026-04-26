const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { transaction } = require('../config/db');
const userModel = require('../models/userModel');
const { badRequest, conflict, unauthorized } = require('../utils/errors');
const { serializeUser } = require('../utils/serializers');

function signToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
}

async function login({ email, password }) {
  const user = await userModel.findByEmail(email);
  if (!user) {
    throw unauthorized('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw unauthorized('Invalid email or password');
  }

  return {
    token: signToken(user),
    user: serializeUser(user),
  };
}

async function createUser({ name, email, password, role }) {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw conflict('Email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await transaction(async (client) => {
    return userModel.createUser(client, {
      name,
      email,
      passwordHash,
      role,
    });
  });

  if (!user) {
    throw badRequest('Unable to create user');
  }

  return serializeUser(user);
}

module.exports = {
  login,
  createUser,
};
