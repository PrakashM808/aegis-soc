const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'aegis_soc',
  process.env.DB_USER || 'aegis_admin',
  process.env.DB_PASSWORD || 'password123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      idle: 10000
    }
  }
);

sequelize.authenticate()
  .then(() => console.log('✓ Database connected'))
  .catch(err => console.error('✗ Database error:', err));

module.exports = sequelize;
