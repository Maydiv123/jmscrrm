const { User } = require('../models');

const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
const attachment = (req, res, next) => {
  console.log('Auth middleware - Session:', req.session);
  
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Attach user info to request for easier access
  req.user = {
    id: req.session.userId,
    username: req.session.username,
    isAdmin: req.session.isAdmin,
    role: req.session.role
  };
  
  next();
};
module.exports = { requireAuth, requireAdmin, requireRole , attachment };