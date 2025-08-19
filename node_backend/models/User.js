const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
 const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  designation: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'subadmin', 'stage1_employee', 'stage2_employee', 'stage3_employee', 'customer'),
    defaultValue: 'stage1_employee'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

  return User;
};
