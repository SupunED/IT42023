const { sequelize, Order, OrderItem, Delivery, Book, Cart, User } = require('../models');
const { sendOrderConfirmation } = require('../services/emailService');

/**
 * Generate unique readable order ID like BN-2026-59123
 */
const generateOrderID = () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const year = new Date().getFullYear();
  return `BN-${year}-${randomNum}`;
};

/**
 * Create a new order (Supports Authenticated Customer and Guest Checkout)
 */
const checkout = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userID = req.user ? req.user.userID : null;
    const {
      guestEmail,
      guestName,
      guestPhone,
      deliveryAddress,
      paymentMethod = 'Credit Card (Stripe)',
      items = [], // Array of { bookID, quantity }
      notes
    } = req.body;

    if (!deliveryAddress) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Delivery address is required' });
    }

    if (!userID && !guestEmail) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Guest email is required for guest checkout' });
    }

    if (!items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Order must contain at least one book' });
    }

    let subtotal = 0;
    const orderItemsToCreate = [];
    const booksToUpdate = [];

    // Validate books and stock
    for (const item of items) {
      const book = await Book.findByPk(item.bookID, { transaction });
      if (!book) {
        await transaction.rollback();
        return res.status(404).json({ message: `Book not found: ${item.bookID}` });
      }

      const qty = parseInt(item.quantity) || 1;
      if (book.stock < qty) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Insufficient stock for "${book.title}". Available: ${book.stock}, Requested: ${qty}`
        });
      }

      const itemTotal = Number(book.price) * qty;
      subtotal += itemTotal;

      orderItemsToCreate.push({
        bookID: book.bookID,
        quantity: qty,
        unitPrice: book.price,
        totalPrice: parseFloat(itemTotal.toFixed(2)),
        bookTitle: book.title // Cached for email
      });

      // Deduct inventory
      book.stock -= qty;
      if (book.stock === 0) {
        book.isAvailable = false;
      }
      booksToUpdate.push(book);
    }

    const shippingFee = subtotal > 50 ? 0.00 : 4.99;
    const total = parseFloat((subtotal + shippingFee).toFixed(2));
    const orderID = generateOrderID();

    // 1. Create Order
    const order = await Order.create({
      orderID,
      userID,
      guestEmail: guestEmail || (req.user ? req.user.email : null),
      guestName: guestName || (req.user ? req.user.name : 'Valued Customer'),
      guestPhone: guestPhone || (req.user ? req.user.phone : null),
      subtotal: parseFloat(subtotal.toFixed(2)),
      shippingFee,
      total,
      paymentStatus: 'paid', // Simulated successful payment
      paymentMethod,
      paymentTransactionID: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      deliveryAddress,
      status: 'Reviewing',
      notes
    }, { transaction });

    // 2. Save Order Items
    for (const item of orderItemsToCreate) {
      await OrderItem.create({
        orderID: order.orderID,
        bookID: item.bookID,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }, { transaction });
    }

    // 3. Update Book Stocks
    for (const book of booksToUpdate) {
      await book.save({ transaction });
    }

    // 4. Create Delivery Tracking Record
    await Delivery.create({
      orderID: order.orderID,
      trackingNumber: `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`,
      carrier: 'BookNest Express Courier',
      status: 'Pending',
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 days
      notes: 'Parcel packaging initiated at Seattle Fulfillment Hub'
    }, { transaction });

    // 5. Clear Cart if user was logged in
    if (userID) {
      await Cart.destroy({ where: { userID }, transaction });
    }

    await transaction.commit();

    // 6. Asynchronously trigger Azure Email Notification
    const recipientEmail = order.guestEmail;
    sendOrderConfirmation(order, orderItemsToCreate.map(i => ({
      quantity: i.quantity,
      totalPrice: i.totalPrice,
      book: { title: i.bookTitle }
    })), recipientEmail).catch(err => console.error('Order email error:', err));

    return res.status(201).json({
      message: 'Order placed successfully!',
      orderID: order.orderID,
      order
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Checkout error:', error);
    return res.status(500).json({ message: 'Failed to process checkout', error: error.message });
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
      where: { userID },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Book, as: 'book', attributes: ['bookID', 'title', 'coverPhotoUrl', 'author'] }]
        },
        {
          model: Delivery,
          as: 'delivery'
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
