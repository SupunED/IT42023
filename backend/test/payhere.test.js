const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createPayment, verifyNotification, statusToken, verifyStatusToken, getConfig } = require('../src/services/payhere');

const config = { merchantID: '123456', secret: 'test-only-secret', notifyURL: 'https://example.com/api/payments/payhere/notify' };
const digest = value => crypto.createHash('md5').update(value).digest('hex').toUpperCase();
const notification = (overrides = {}) => {
  const body = { merchant_id: config.merchantID, order_id: 'BN-test', payment_id: 'payment-1', payhere_amount: '24.99', payhere_currency: 'USD', status_code: '2', ...overrides };
  body.md5sig = digest(`${body.merchant_id}${body.order_id}${body.payhere_amount}${body.payhere_currency}${body.status_code}${digest(config.secret)}`);
  return body;
};

test('payment payload uses sandbox, USD, two decimal places and a server hash without the secret', () => {
  const payment = createPayment({ orderID: 'BN-test', total: 24.9 }, { name: 'Test Customer', email: 'test@example.com', phone: '0771234567', address: '1 Test Road', city: 'Colombo', country: 'Sri Lanka' }, config);
  assert.equal(payment.sandbox, true);
  assert.equal(payment.amount, '24.90');
  assert.equal(payment.currency, 'USD');
  assert.equal(payment.hash, digest(`123456BN-test24.90USD${digest(config.secret)}`));
  assert.equal(JSON.stringify(payment).includes(config.secret), false);
});

test('signed notifications reject tampering and unexpected merchants, currencies and statuses', () => {
  assert.equal(verifyNotification(notification(), config), true);
  for (const field of ['order_id', 'payhere_amount', 'status_code']) {
    assert.equal(verifyNotification({ ...notification(), [field]: '999' }, config), false);
  }
  for (const overrides of [{ merchant_id: 'other' }, { payhere_currency: 'LKR' }, { status_code: '5' }, { payhere_amount: '24.999' }]) {
    assert.equal(verifyNotification(notification(overrides), config), false);
  }
  assert.equal(verifyNotification({ ...notification(), md5sig: ['bad'] }, config), false);
  assert.equal(verifyNotification(null, config), false);
});

test('status tokens are scoped to an order and reject invalid input', () => {
  const token = statusToken('BN-test', config);
  assert.equal(verifyStatusToken('BN-test', token, config), true);
  assert.equal(verifyStatusToken('BN-other', token, config), false);
  for (const value of [null, [], 'invalid', 'a'.repeat(64), '\u00e9'.repeat(64)]) {
    assert.equal(verifyStatusToken('BN-test', value, config), false);
  }
});

test('missing sandbox configuration fails closed', () => {
  const previous = process.env.PAYHERE_NOTIFY_URL;
  process.env.PAYHERE_NOTIFY_URL = 'http://localhost:5000/notify';
  try { assert.throws(getConfig, { status: 503 }); }
  finally {
    if (previous === undefined) delete process.env.PAYHERE_NOTIFY_URL;
    else process.env.PAYHERE_NOTIFY_URL = previous;
  }
});

let state;
let emails;
const transaction = { LOCK: { UPDATE: 'UPDATE' } };
const attachSave = record => record && Object.assign(record, { save: async () => {} });
const models = {
  sequelize: { transaction: async callback => {
    const snapshot = JSON.parse(JSON.stringify(state));
    try { return await callback(transaction); }
    catch (error) { state = snapshot; throw error; }
  } },
  Order: {
    findByPk: async (orderID, options) => {
      assert.equal(options.lock, 'UPDATE');
      return attachSave(state.orders.find(order => order.orderID === orderID));
    },
    findAll: async () => state.orders.filter(order => order.paymentStatus === 'pending'),
    create: async values => { const order = { ...values, createdAt: new Date() }; state.orders.push(order); return order; }
  },
  OrderItem: {
    findAll: async options => state.items.filter(item => item.orderID === options.where.orderID).map(item => ({ ...item, book: state.book })),
    create: async values => { state.items.push(values); return values; }
  },
  Book: { findByPk: async (bookID, options) => { assert.equal(options.lock, 'UPDATE'); return bookID === state.book.bookID ? attachSave(state.book) : null; } },
  Cart: { findAll: async () => [] },
  Delivery: { create: async values => {
    if (state.failDelivery) throw new Error('Delivery write failed');
    state.deliveries.push(values);
  } }
};
require.cache[require.resolve('../src/models')] = { loaded: true, exports: models };
require.cache[require.resolve('../src/services/emailService')] = { loaded: true, exports: { sendOrderConfirmation: async () => { emails++; } } };
const { notify, paymentStatus, cancelPayment, expireReservations } = require('../src/controllers/paymentController');
const { checkout } = require('../src/controllers/orderController');
const response = () => ({ statusCode: 200, set() {}, status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }, send(body) { this.body = body; return this; } });

test('PayHere order lifecycle', async context => {
  const previous = { ...process.env };
  process.env.PAYHERE_MERCHANT_ID = config.merchantID;
  process.env.PAYHERE_MERCHANT_SECRET = config.secret;
  process.env.PAYHERE_NOTIFY_URL = config.notifyURL;
  context.after(() => {
    for (const key of ['PAYHERE_MERCHANT_ID', 'PAYHERE_MERCHANT_SECRET', 'PAYHERE_NOTIFY_URL']) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
  });
  context.beforeEach(() => {
    emails = 0;
    state = { orders: [{ orderID: 'BN-test', total: '24.99', createdAt: new Date(), paymentStatus: 'pending',
      paymentMethod: 'PayHere Sandbox (USD)', status: 'Reviewing', guestEmail: 'test@example.com' }],
    items: [{ orderID: 'BN-test', bookID: 'book-1', quantity: 2 }],
    book: { bookID: 'book-1', title: 'Test Book', stock: 3, isAvailable: true, price: '25.00' }, deliveries: [] };
  });
  const callNotify = async body => { const res = response(); await notify({ body }, res); return res; };
  await context.test('checkout reserves stock and stays pending; exactly $50 qualifies for free shipping', async () => {
    const res = response();
    await checkout({ body: { guestName: 'Test Customer', guestEmail: 'test@example.com', guestPhone: '0771234567',
      deliveryAddress: '1 Test Road', city: 'Colombo', country: 'Sri Lanka', items: [{ bookID: 'book-1', quantity: 2 }] } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.payment.amount, '50.00');
    assert.equal(state.orders[1].paymentStatus, 'pending');
    assert.equal(state.book.stock, 1);
    assert.equal(state.deliveries.length, 0);
    assert.equal(emails, 0);
  });
  await context.test('rejects invalid quantities and duplicate books without reserving stock', async () => {
    for (const items of [[{ bookID: 'book-1', quantity: -1 }], [{ bookID: 'book-1', quantity: 1.5 }], [{ bookID: 'book-1', quantity: 1 }, { bookID: 'book-1', quantity: 1 }]]) {
      const res = response();
      await checkout({ body: { guestName: 'Test Customer', guestEmail: 'test@example.com', guestPhone: '0771234567', deliveryAddress: '1 Test Road', city: 'Colombo', country: 'Sri Lanka', items } }, res);
      assert.equal(res.statusCode, 400);
      assert.equal(state.book.stock, 3);
    }
  });
  await context.test('success and duplicate notifications fulfill and email only once', async () => {
    assert.equal((await callNotify(notification())).statusCode, 200);
    assert.equal((await callNotify(notification())).statusCode, 200);
    assert.equal(state.orders[0].paymentStatus, 'paid');
    assert.equal(state.orders[0].paymentTransactionID, 'payment-1');
    assert.equal(state.deliveries.length, 1);
    assert.equal(state.book.stock, 3);
    assert.equal(emails, 1);
  });
  await context.test('verified payment preserves extra authenticated cart quantities', async () => {
    state.orders[0].userID = 'customer-1';
    const originalFind = models.Cart.findAll;
    const cartItem = { quantity: 3, save: async () => {}, destroy: async () => assert.fail('Extra cart quantity must be preserved') };
    models.Cart.findAll = async options => {
      assert.equal(options.where.userID, 'customer-1');
      assert.equal(options.where.bookID, 'book-1');
      assert.equal(options.lock, 'UPDATE');
      return [cartItem];
    };
    try {
      await callNotify(notification());
      await callNotify(notification());
      assert.equal(cartItem.quantity, 1);
    } finally {
      models.Cart.findAll = originalFind;
    }
  });
  await context.test('valid signature with mismatched order total is rejected', async () => {
    assert.equal((await callNotify(notification({ payhere_amount: '1.00' }))).statusCode, 400);
    assert.equal(state.orders[0].paymentStatus, 'pending');
    assert.equal(state.deliveries.length, 0);
  });
  await context.test('failure restores reservation only once and leaves cart and delivery untouched', async () => {
    await callNotify(notification({ status_code: '-2' }));
    await callNotify(notification({ status_code: '-2' }));
    assert.equal(state.book.stock, 5);
    assert.equal(state.orders[0].paymentStatus, 'failed');
    assert.equal(state.deliveries.length, 0);
    assert.equal(emails, 0);
  });
  await context.test('a later failure cannot undo an already paid order', async () => {
    await callNotify(notification());
    await callNotify(notification({ status_code: '-2' }));
    assert.equal(state.orders[0].paymentStatus, 'paid');
    assert.equal(state.book.stock, 3);
  });
  await context.test('customer cancellation releases once and cannot cancel a paid payment', async () => {
    const request = { body: { orderID: 'BN-test', paymentToken: statusToken('BN-test', config) } };
    await cancelPayment(request, response());
    await cancelPayment(request, response());
    assert.equal(state.book.stock, 5);
    assert.equal(state.orders[0].paymentStatus, 'failed');
    await callNotify(notification());
    const res = response();
    await cancelPayment(request, res);
    assert.equal(res.body.paymentStatus, 'paid');
    assert.equal(res.body.reviewRequired, true);
    assert.equal(state.book.stock, 5);
  });
  await context.test('unauthorized cancellation cannot release a reservation', async () => {
    const res = response();
    await cancelPayment({ body: { orderID: 'BN-test', paymentToken: 'invalid' } }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(state.orders[0].paymentStatus, 'pending');
    assert.equal(state.book.stock, 3);
  });
  await context.test('expiry restores stock and late success requires manual review without fulfillment', async () => {
    state.orders[0].createdAt = new Date(Date.now() - 31 * 60 * 1000);
    await expireReservations();
    await expireReservations();
    assert.equal(state.book.stock, 5);
    await callNotify(notification());
    assert.equal(state.orders[0].paymentStatus, 'paid');
    assert.equal(state.orders[0].status, 'Cancelled');
    assert.equal(state.deliveries.length, 0);
    const res = response();
    await paymentStatus({ body: { orderID: 'BN-test', paymentToken: statusToken('BN-test', config) } }, res);
    assert.equal(res.body.reviewRequired, true);
  });
  await context.test('status requires an order-scoped token and exposes no contact details', async () => {
    const denied = response();
    await paymentStatus({ body: { orderID: 'BN-test', paymentToken: 'bad' } }, denied);
    assert.equal(denied.statusCode, 403);
    const allowed = response();
    await paymentStatus({ body: { orderID: 'BN-test', paymentToken: statusToken('BN-test', config) } }, allowed);
    assert.equal(allowed.body.paymentStatus, 'pending');
    assert.equal(allowed.body.guestEmail, undefined);
  });
  await context.test('delivery failure rolls back paid state and permits a successful callback retry', async () => {
    state.failDelivery = true;
    assert.equal((await callNotify(notification())).statusCode, 500);
    assert.equal(state.orders[0].paymentStatus, 'pending');
    assert.equal(emails, 0);
    state.failDelivery = false;
    assert.equal((await callNotify(notification())).statusCode, 200);
    assert.equal(state.deliveries.length, 1);
  });
  await context.test('chargebacks stop fulfillment and cannot be overwritten by a repeated success', async () => {
    await callNotify(notification());
    await callNotify(notification({ status_code: '-3' }));
    await callNotify(notification());
    assert.equal(state.orders[0].paymentStatus, 'failed');
    assert.equal(state.orders[0].status, 'Cancelled');
    assert.equal(state.book.stock, 3);
    assert.equal(state.deliveries.length, 1);
  });
  await context.test('admin cannot create delivery for unpaid or late PayHere payments', async () => {
    const { updateOrderStatus } = require('../src/controllers/adminController');
    const originalFind = models.Order.findByPk;
    models.Order.findByPk = async () => state.orders[0];
    try {
      for (const paymentStatus of ['pending', 'failed', 'refunded', 'paid']) {
        state.orders[0].paymentStatus = paymentStatus;
        const res = response();
        await updateOrderStatus({ params: { orderID: 'BN-test' }, body: { status: 'Processing' } }, res);
        assert.equal(res.statusCode, 409);
        assert.equal(state.deliveries.length, 0);
        assert.equal(state.orders[0].status, 'Reviewing');
      }
    } finally {
      models.Order.findByPk = originalFind;
    }
  });
  await context.test('HTTP webhook accepts signed forms without Origin while browser payment routes remain protected', async context => {
    const app = require('../src/app');
    const { sessionStore, allowedOrigins } = require('../src/config/session');
    sessionStore.stopExpiringSessions();
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    context.after(() => new Promise(resolve => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}`;
    const notifyURL = `${base}/api/payments/payhere/notify`;
    const invalid = await fetch(notifyURL, { method: 'POST', body: new URLSearchParams({ ...notification(), md5sig: 'invalid' }) });
    assert.equal(invalid.status, 400);
    for (const path of ['checkout', 'payment-status', 'payment-cancel']) {
      const denied = await fetch(`${base}/api/orders/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      assert.equal(denied.status, 403);
      assert.equal((await denied.json()).message, 'Request origin is not allowed.');
    }
    const allowed = await fetch(`${base}/api/orders/payment-status`, { method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: [...allowedOrigins][0] },
      body: JSON.stringify({ orderID: 'BN-test', paymentToken: statusToken('BN-test', config) }) });
    assert.equal(allowed.status, 200);
    assert.equal((await allowed.json()).paymentStatus, 'pending');
    assert.equal(allowed.headers.get('cache-control'), 'no-store');
    assert.equal(allowed.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    for (let attempt = 0; attempt < 2; attempt++) {
      const accepted = await fetch(notifyURL, { method: 'POST', body: new URLSearchParams(notification()) });
      assert.equal(accepted.status, 200);
    }
    assert.equal(state.orders[0].paymentStatus, 'paid');
    assert.equal(state.deliveries.length, 1);
    assert.equal(emails, 1);
  });
});