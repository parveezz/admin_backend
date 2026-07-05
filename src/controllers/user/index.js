const { getUsers } = require('./getUsers');
const { getUserById } = require('./getUserById');
const { createUser } = require('./createUser');
const { updateUser } = require('./updateUser');
const { deleteUser } = require('./deleteUser');
const { toggleUserStatus } = require('./status');
const { restoreUser } = require('./restore');

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  restoreUser,
};
