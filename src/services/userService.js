const userModel = require('../models/userModel');
const { serializeUser } = require('../utils/serializers');

async function listUsers(filters) {
  const result = await userModel.listUsers(filters);
  return {
    data: result.rows.map(serializeUser),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      total_pages: Math.ceil(result.total / filters.limit),
    },
  };
}

module.exports = {
  listUsers,
};
