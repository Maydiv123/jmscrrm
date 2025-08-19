const User = require('../models/User');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    
    if (!user || user.password_hash !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.isAdmin = user.is_admin;
    req.session.username = user.username;

    res.json({
      success: true,
      is_admin: user.is_admin,
      role: user.role,
      username: user.username
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
};

exports.checkSession = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) {
      return res.status(404).json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user_id: user.id,
      username: user.username,
      is_admin: user.is_admin,
      role: user.role
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};