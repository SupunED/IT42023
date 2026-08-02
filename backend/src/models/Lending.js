const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lending = sequelize.define('Lending', {
  lendID: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userID: {
    type: DataTypes.UUID,
    allowNull: false
  },
  bookID: {
    type: DataTypes.UUID,
    allowNull: false
  },
  requestDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  returnDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  durationDays: {
    type: DataTypes.INTEGER,
    defaultValue: 14,
    allowNull: false
  },
  lendingFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Active', 'Overdue', 'Returned', 'Rejected'),
    defaultValue: 'Pending',
    allowNull: false
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'Lending'
});

module.exports = Lending;
