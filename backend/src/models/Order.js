const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  orderID: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  userID: {
    type: DataTypes.UUID,
    allowNull: true // Allows guest checkout
  },
  guestEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guestName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guestPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shippingFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 4.99
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    defaultValue: 'Credit Card (Stripe)'
  },
  paymentTransactionID: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deliveryAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Reviewing', 'Processing', 'Ready', 'In Progress', 'Delivered', 'Cancelled'),
    defaultValue: 'Reviewing',
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'Orders'
});

module.exports = Order;
