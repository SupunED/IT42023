const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Delivery = sequelize.define('Delivery', {
  deliveryID: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderID: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  trackingNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  carrier: {
    type: DataTypes.STRING,
    defaultValue: 'BookNest Express Courier'
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Dispatched', 'In Transit', 'Out for Delivery', 'Delivered'),
    defaultValue: 'Pending',
    allowNull: false
  },
  estimatedDeliveryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'Delivery'
});

module.exports = Delivery;
