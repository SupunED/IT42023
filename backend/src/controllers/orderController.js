const { randomUUID } = require('node:crypto');
const { sequelize, Order, OrderItem, Delivery, Book } = require('../models');
const payhere = require('../services/payhere');

/**
 * Generate unique readable order ID like BN-2026-59123
 */
const generateOrderID = () => {
  const randomNum = randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase();
  const year = new Date().getFullYear();
  return `BN-${year}-${randomNum}`;
};

/**
 * Create a new order (Supports Authenticated Customer and Guest Checkout)
 */
const checkout = async (req, res) => {
  try {
    const config = payhere.getConfig();
    const userID = req.user ? req.user.userID : null;
    const {
      guestEmail,
      guestName,
      guestPhone,
      deliveryAddress,
      city,
      country,
      items = [],
      notes
    } = req.body || {};
    const contact = { name: guestName || req.user?.name, email: guestEmail || req.user?.email,
      phone: guestPhone || req.user?.phone, address: deliveryAddress, city, country };
    if (Object.values(contact).some(value => typeof value !== 'string' || !value.trim() || value.length > 250) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) || !/^[+\d\s()-]{7,30}$/.test(contact.phone) ||
        (notes != null && (typeof notes !== 'string' || notes.length > 2000))) {
      return res.status(400).json({ message: 'Provide valid contact details, city, country and delivery address.' });
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 100 || items.some(item =>
      !item || typeof item.bookID !== 'string' || !item.bookID || item.bookID.length > 100 ||
      !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) ||
      new Set(items.map(item => item.bookID)).size !== items.length) {
      return res.status(400).json({ message: 'Provide unique books with whole quantities between 1 and 100.' });
    }
    const order = await sequelize.transaction(async transaction => {
      let subtotalCents = 0;
      const orderItems = [];
      for (const item of [...items].sort((first, second) => first.bookID.localeCompare(second.bookID))) {
        const book = await Book.findByPk(item.bookID, { transaction, lock: transaction.LOCK.UPDATE });
        if (!book || !book.isAvailable || book.stock < item.quantity) {
          throw Object.assign(new Error('A book is unavailable or has insufficient stock. Update your cart and retry.'), { status: 409 });
        }
        const priceCents = Math.round(Number(book.price) * 100);
        if (!Number.isSafeInteger(priceCents) || priceCents < 0) throw new Error('Invalid book price');
        subtotalCents += priceCents * item.quantity;
        orderItems.push({ bookID: book.bookID, quantity: item.quantity, unitPrice: (priceCents / 100).toFixed(2), totalPrice: (priceCents * item.quantity / 100).toFixed(2) });
        book.stock -= item.quantity;
        if (book.stock === 0) book.isAvailable = false;
        await book.save({ transaction });
      }
      const shippingCents = subtotalCents >= 5000 ? 0 : 499;
      const created = await Order.create({
        orderID: generateOrderID(), userID, guestEmail: contact.email.trim(), guestName: contact.name.trim(), guestPhone: contact.phone.trim(),
        subtotal: (subtotalCents / 100).toFixed(2), shippingFee: (shippingCents / 100).toFixed(2), total: ((subtotalCents + shippingCents) / 100).toFixed(2),
        paymentStatus: 'pending', paymentMethod: payhere.PAYMENT_METHOD, paymentTransactionID: null,
        deliveryAddress, status: 'Reviewing', notes
      }, { transaction });
      for (const item of orderItems) await OrderItem.create({ ...item, orderID: created.orderID }, { transaction });
      return created;
    });
    res.set('Cache-Control', 'no-store');
    return res.status(201).json({ orderID: order.orderID, payment: payhere.createPayment(order, contact, config),
      paymentToken: payhere.statusToken(order.orderID, config), expiresAt: new Date(new Date(order.createdAt).getTime() + payhere.RESERVATION_MS) });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(error.status || 500).json({ message: error.status ? error.message : 'Failed to start checkout. Please try again.' });
  }
};

/**
 * Track Order by Order ID (Accessible to Guests and Authenticated Users)
 */
const trackOrder = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { orderID, email } = (req.method === 'GET' ? req.query : req.body) || {};

    if (typeof orderID !== 'string' || !orderID.trim()) {
      return res.status(400).json({ message: 'Order ID is required for tracking' });
    }

    const whereClause = { orderID: orderID.trim() };
    if (typeof email === 'string' && email.trim()) {
      whereClause.guestEmail = email.trim();
    } else if (req.user) {
      if (req.user.role !== 'admin') whereClause.userID = req.user.userID;
    } else {
      return res.status(400).json({ message: 'Order ID and checkout email are required for guest tracking.' });
    }

    const order = await Order.findOne({
      where: whereClause,
      attributes: ['orderID', 'status', 'createdAt'],
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: ['itemID', 'quantity', 'totalPrice'],
          include: [{ model: Book, as: 'book', attributes: ['title', 'coverPhotoUrl', 'author', 'price'] }]
        },
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['trackingNumber', 'carrier', 'status', 'estimatedDeliveryDate', 'deliveredAt']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'No order found with the provided details.' });
    }

    return res.status(200).json({ order });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to track order', error: error.message });
  }
};

/**
 * Get authenticated user's order history
 */
const getUserOrders = async (req, res) => {
  try {
    const userID = req.user.userID;
    const orders = await Order.findAll({
      where: { userID, paymentStatus: 'paid' },
      attributes: ['orderID', 'subtotal', 'shippingFee', 'total', 'paymentStatus', 'status', 'createdAt'],
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: ['itemID', 'quantity', 'unitPrice', 'totalPrice'],
          include: [{ model: Book, as: 'book', attributes: ['bookID', 'title', 'coverPhotoUrl', 'author', 'price'] }]
        },
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['trackingNumber', 'carrier', 'status', 'estimatedDeliveryDate', 'deliveredAt']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user orders', error: error.message });
  }
};

module.exports = {
  checkout,
  trackOrder,
  getUserOrders
};
