const { User } = require('../models');
exports.getAllUsers = async (req, res) => {
  try {
    // if (!req.session.isAdmin) {
    //   return res.status(403).json({ success: false, message: 'Forbidden' });
    // }

    const users = await User.findAll({
      attributes: ['id', 'username', 'designation', 'is_admin', 'role']
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    if (!req.session.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { username, password, designation, is_admin, role } = req.body;
    const user = await User.create({
      username,
      password_hash: password, // In production, hash this password
      designation,
      is_admin: is_admin || false,
      role: role || 'stage1_employee'
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};