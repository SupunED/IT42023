const { randomUUID } = require('node:crypto');
const { Op } = require('sequelize');
const { sequelize, Order, OrderItem, Book, Cart, Delivery } = require('../models');
const { sendOrderConfirmation } = require('../services/emailService');
const payhere = require('../services/payhere');

const releaseReservation = async (order, transaction, reason) => {
  if (order.paymentStatus !== 'pending') return;
  const items = await OrderItem.findAll({ where: { orderID: order.orderID }, order: [['bookID', 'ASC']], transaction });
  for (const item of items) {
    const book = await Book.findByPk(item.bookID, { transaction, lock: transaction.LOCK.UPDATE });
    if (book) {
      book.stock += item.quantity;
      book.isAvailable = true;
      await book.save({ transaction });
    }
  }
  order.paymentStatus = 'failed';
  order.status = 'Cancelled';
  order.notes = `${order.notes || ''}\n${reason}`.trim();
  await order.save({ transaction });
};

const expireOrder = async orderID => sequelize.transaction(async transaction => {
  const order = await Order.findByPk(orderID, { transaction, lock: transaction.LOCK.UPDATE });
  if (order?.paymentMethod === payhere.PAYMENT_METHOD && order.paymentStatus === 'pending' &&
      Date.now() - new Date(order.createdAt).getTime() >= payhere.RESERVATION_MS) {
    await releaseReservation(order, transaction, 'PayHere payment window expired; stock reservation released.');
  }
  return order;
});

const expireReservations = async () => {
  const orders = await Order.findAll({ where: { paymentMethod: payhere.PAYMENT_METHOD, paymentStatus: 'pending',
    createdAt: { [Op.lte]: new Date(Date.now() - payhere.RESERVATION_MS) } }, attributes: ['orderID'], limit: 100 });
  for (const order of orders) await expireOrder(order.orderID);
};

const paymentStatus = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const { orderID, paymentToken } = req.body || {};
    if (typeof orderID !== 'string' || orderID.length > 100 || !payhere.verifyStatusToken(orderID, paymentToken)) {
      return res.status(403).json({ message: 'Invalid payment access token.' });
    }
    const order = await expireOrder(orderID);
    if (!order || order.paymentMethod !== payhere.PAYMENT_METHOD) return res.status(404).json({ message: 'Payment not found.' });
    return res.json({ orderID: order.orderID, paymentStatus: order.paymentStatus,
      reviewRequired: order.paymentStatus === 'paid' && order.status === 'Cancelled',
      total: order.total, currency: payhere.CURRENCY });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to check payment status.' });
  }
};

const cancelPayment = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const { orderID, paymentToken } = req.body || {};
    if (typeof orderID !== 'string' || orderID.length > 100 || !payhere.verifyStatusToken(orderID, paymentToken)) {
      return res.status(403).json({ message: 'Invalid payment access token.' });
    }
    await sequelize.transaction(async transaction => {
      const order = await Order.findByPk(orderID, { transaction, lock: transaction.LOCK.UPDATE });
      if (!order || order.paymentMethod !== payhere.PAYMENT_METHOD) throw Object.assign(new Error('Payment not found.'), { status: 404 });
      await releaseReservation(order, transaction, 'Customer cancelled checkout; stock reservation released.');
    });
    return paymentStatus(req, res);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to cancel checkout. Check payment status before retrying.' });
  }
};

const notify = async (req, res) => {
  try {
    if (!payhere.verifyNotification(req.body)) return res.status(400).send('Invalid notification');
    const body = req.body;
    const confirmed = await sequelize.transaction(async transaction => {
      const order = await Order.findByPk(body.order_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!order || order.paymentMethod !== payhere.PAYMENT_METHOD || Number(order.total).toFixed(2) !== body.payhere_amount) {
        throw Object.assign(new Error('Payment does not match order'), { status: 400 });
      }
      if (order.paymentTransactionID && order.paymentTransactionID !== body.payment_id) {
        throw Object.assign(new Error('Conflicting payment ID; manual review required'), { status: 409 });
      }
      if (body.status_code === '-3') {
        if (order.paymentStatus === 'paid') {
          order.paymentStatus = 'failed';
          order.status = 'Cancelled';
          order.notes = `${order.notes || ''}\nPayHere chargeback ${body.payment_id}; stop fulfillment and review manually.`.trim();
          await order.save({ transaction });
        }
        return null;
      }
      if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded' || order.paymentTransactionID) return null;
      if (body.status_code === '0') return null;
      if (body.status_code === '-1' || body.status_code === '-2') {
        await releaseReservation(order, transaction, 'PayHere payment failed or was cancelled; stock reservation released.');
        return null;
      }
      if (order.paymentStatus === 'pending' && Date.now() - new Date(order.createdAt).getTime() >= payhere.RESERVATION_MS) {
        await releaseReservation(order, transaction, 'PayHere payment arrived after reservation expiry.');
      }
      const needsReview = order.paymentStatus !== 'pending' || order.status === 'Cancelled';
      order.paymentStatus = 'paid';
      order.paymentTransactionID = body.payment_id;
      if (needsReview) {
        order.status = 'Cancelled';
        order.notes = `${order.notes || ''}\nPAYMENT RECEIVED AFTER RESERVATION RELEASE: verify stock and fulfill manually or refund in PayHere. No delivery created.`.trim();
        await order.save({ transaction });
        return null;
      }
      order.status = 'Reviewing';
      await order.save({ transaction });
      const items = await OrderItem.findAll({ where: { orderID: order.orderID }, include: [{ model: Book, as: 'book' }], transaction });
      await Delivery.create({ orderID: order.orderID, trackingNumber: `TRK-${randomUUID()}`, carrier: 'BookNest Express Courier',
        status: 'Pending', estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }, { transaction });
      if (order.userID) {
        for (const item of [...items].sort((first, second) => first.bookID.localeCompare(second.bookID))) {
          const cartItems = await Cart.findAll({ where: { userID: order.userID, bookID: item.bookID }, transaction, lock: transaction.LOCK.UPDATE });
          for (const cartItem of cartItems) {
            if (cartItem.quantity <= item.quantity) await cartItem.destroy({ transaction });
            else { cartItem.quantity -= item.quantity; await cartItem.save({ transaction }); }
          }
        }
      }
      return { order, items };
    });
    if (confirmed) {
      Promise.resolve().then(() => sendOrderConfirmation(confirmed.order, confirmed.items, confirmed.order.guestEmail))
        .catch(error => console.error('Paid order email failed:', error.message));
    }
    return res.status(200).send('OK');
  } catch (error) {
    console.error('PayHere notification failed:', error.message);
    return res.status(error.status || 500).send(error.status ? error.message : 'Notification processing failed');
  }
};

module.exports = { notify, paymentStatus, cancelPayment, expireReservations };