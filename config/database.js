/**
 * Database Configuration
 * PostgreSQL with Sequelize ORM
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'aegis_soc',
  process.env.DB_USER || 'aegis_admin',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      charset: 'utf8mb4',
    },
    retry: {
      max: 3,
      timeout: 3000,
    },
  }
);

module.exports = sequelize;
