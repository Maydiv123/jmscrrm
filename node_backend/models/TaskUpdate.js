// models/TaskUpdate.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TaskUpdate = sequelize.define(
    "TaskUpdate",
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
      },
      status: {
        type: DataTypes.ENUM("Assigned", "In Progress", "Completed"),
        allowNull: false,
      },
      comment: {
        type: DataTypes.TEXT,
      }
    },
    {
      tableName: "task_updates",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  return TaskUpdate;
};