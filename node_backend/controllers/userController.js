const { User } = require('../models');
const bcrypt = require('bcryptjs');

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
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      username,
      password_hash: hashedPassword,
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

exports.updateUser = async (req, res) => {
  try {
    if (!req.session.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;
    const { username, password, designation, is_admin, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prepare update data
    const updateData = {
      username,
      designation,
      is_admin: is_admin || false,
      role: role || 'stage1_employee'
    };

    // Only hash password if it's provided
    if (password && password.trim() !== '') {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);

    res.json({ success: true, user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (!req.session.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deletion of the current admin user
    if (user.id === req.session.userId) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    await user.destroy();

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};