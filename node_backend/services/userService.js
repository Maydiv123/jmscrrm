const User = require('../models/User');

class UserService {
  async getAllUsers() {
    return await User.findAll({
      attributes: ['id', 'username', 'designation', 'is_admin', 'role']
    });
  }

  async getUserById(id) {
    return await User.findByPk(id, {
      attributes: ['id', 'username', 'designation', 'is_admin', 'role']
    });
  }

  async getUserByUsername(username) {
    return await User.findOne({ where: { username } });
  }

  async createUser(userData) {
    return await User.create({
      username: userData.username,
      password_hash: userData.password, // For now, store plain text (as per current system)
      designation: userData.designation,
      is_admin: userData.is_admin || false,
      role: userData.role || 'stage1_employee'
    });
  }

  async isAdminOrSubadmin(userId) {
    const user = await User.findByPk(userId);
    return user && (user.is_admin || user.role === 'subadmin');
  }
}

module.exports = new UserService();