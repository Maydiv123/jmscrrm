const userService = require('../services/userService');

exports.getUsers = async (req, res) => {
  try {
    if (!req.session.isAdmin && !(await userService.isAdminOrSubadmin(req.session.userId))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    if (!req.session.isAdmin && !(await userService.isAdminOrSubadmin(req.session.userId))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { username, password, designation, is_admin, role } = req.body;
    const user = await userService.createUser({
      username,
      password,
      designation,
      is_admin,
      role
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};