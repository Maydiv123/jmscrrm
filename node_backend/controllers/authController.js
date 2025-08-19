const authService = require('../services/authService');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await authService.authenticate(username, password);

    // Store user data in session
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
    res.status(401).json({ success: false, message: 'Invalid credentials' });
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