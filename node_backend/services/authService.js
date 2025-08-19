const User = require('../models/User');

class AuthService {
  async authenticate(username, password) {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // For now, using plaintext password comparison as requested
    if (user.password_hash !== password) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  async getUserById(id) {
    return await User.findByPk(id);
  }

  async isAdmin(userId) {
    const user = await User.findByPk(userId);
    return user ? user.is_admin : false;
  }
}

module.exports = new AuthService();