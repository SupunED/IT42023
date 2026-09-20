const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Book = require('./Book');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Cart = require('./Cart');
const Lending = require('./Lending');
const Delivery = require('./Delivery');
const Review = require('./Review');

// Category & Book Associations
Category.hasMany(Book, { foreignKey: 'categoryID', as: 'books', onDelete: 'RESTRICT' });
Book.belongsTo(Category, { foreignKey: 'categoryID', as: 'category', onDelete: 'RESTRICT' });

// User & Order Associations
User.hasMany(Order, { foreignKey: 'userID', as: 'orders', onDelete: 'SET NULL' });
Order.belongsTo(User, { foreignKey: 'userID', as: 'user' });

// Order & OrderItem Associations
Order.hasMany(OrderItem, { foreignKey: 'orderID', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderID', as: 'order' });

// Book & OrderItem Associations
Book.hasMany(OrderItem, { foreignKey: 'bookID', as: 'orderItems', onDelete: 'RESTRICT' });
OrderItem.belongsTo(Book, { foreignKey: 'bookID', as: 'book' });

// Order & Delivery Associations
Order.hasOne(Delivery, { foreignKey: 'orderID', as: 'delivery', onDelete: 'CASCADE' });
Delivery.belongsTo(Order, { foreignKey: 'orderID', as: 'order' });

// User & Cart Associations
User.hasMany(Cart, { foreignKey: 'userID', as: 'cartItems', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'userID', as: 'user' });

// Book & Cart Associations
Book.hasMany(Cart, { foreignKey: 'bookID', as: 'cartEntries', onDelete: 'CASCADE' });
Cart.belongsTo(Book, { foreignKey: 'bookID', as: 'book' });

// User & Lending Associations
User.hasMany(Lending, { foreignKey: 'userID', as: 'lendings', onDelete: 'CASCADE' });
Lending.belongsTo(User, { foreignKey: 'userID', as: 'user' });

// Book & Lending Associations
Book.hasMany(Lending, { foreignKey: 'bookID', as: 'lendings', onDelete: 'RESTRICT' });
Lending.belongsTo(Book, { foreignKey: 'bookID', as: 'book' });

// User & Review Associations
User.hasMany(Review, { foreignKey: 'userID', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userID', as: 'user' });

// Book & Review Associations
Book.hasMany(Review, { foreignKey: 'bookID', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Book, { foreignKey: 'bookID', as: 'book' });

module.exports = {
  sequelize,
  User,
  Category,
  Book,
  Order,
  OrderItem,
  Cart,
  Lending,
  Delivery,
  Review
};
