// controllers/authController.js - Fix the User import
const { User } = require("../models"); // Import from models index

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Add validation
    if (!username || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Username and password are required",
        });
    }

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // For now, using plain text comparison. In production, use bcrypt!
    if (user.password_hash !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    req.session.userId = user.id;
    req.session.isAdmin = user.is_admin;
    req.session.username = user.username;
    req.session.role = user.role;

    res.json({
      success: true,
      username: user.username,
      is_admin: user.is_admin,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Logout failed" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
};

exports.checkSession = (req, res) => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      user_id: req.session.userId,
      username: req.session.username,
      is_admin: req.session.isAdmin,
      role: req.session.role,
    });
  } else {
    res.json({ authenticated: false });
  }
};
