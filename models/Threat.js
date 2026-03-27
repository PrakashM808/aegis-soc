const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Threat = sequelize.define('Threat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50)
  },
  severity: {
    type: DataTypes.STRING(20)
  },
  source_ip: {
    type: DataTypes.STRING(45)
  }
}, {
  tableName: 'threats',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Threat;
