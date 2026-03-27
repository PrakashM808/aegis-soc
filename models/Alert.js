const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  severity: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  source_ip: {
    type: DataTypes.STRING(45)
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'open'
  },
  acknowledged_by: {
    type: DataTypes.INTEGER
  },
  acknowledged_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'alerts',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Alert;
