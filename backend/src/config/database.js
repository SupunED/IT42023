const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// MySQL is the only supported dialect (XAMPP / MariaDB for local dev).
const sequelize = new Sequelize(
  process.env.DB_NAME || 'booknest_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false // Supports managed MySQL (e.g. Azure) SSL
      }
    } : {}
  }
);

module.exports = sequelize;
