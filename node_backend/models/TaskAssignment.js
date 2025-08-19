// models/TaskAssignment.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TaskAssignment = sequelize.define(
    "TaskAssignment",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      task_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        }
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    },
    {
      tableName: "task_assignments",
      timestamps: true,
      createdAt: "assigned_at",
      updatedAt: false,
    }
  );

  return TaskAssignment;
};