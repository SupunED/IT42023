const { test } = require('node:test');
const assert = require('node:assert/strict');

process.env.GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com';
const { OAuth2Client } = require('google-auth-library');
const users = [];
let trackingQuery;
const Order = {
  findOne: async query => { trackingQuery = query; return { orderID: 'test-order', status: 'Processing' }; }
};
const User = {
  findOne: async ({ where }) => users.find(user => Object.entries(where).every(([key, value]) => user[key] === value)),
  findByPk: async userID => users.find(user => user.userID === userID),
  create: async values => {
    const user = { userID: String(users.length + 1), ...values };
    users.push(user);
    return user;
  }
};
require.cache[require.resolve('../src/models')] = { loaded: true, exports: { User, Order, Lending: {}, Book: {}, sequelize: {}, OrderItem: {}, Delivery: {}, Cart: {} } };
require.cache[require.resolve('../src/services/emailService')] = { loaded: true, exports: { sendOrderConfirmation: async () => {} } };
const auth = require('../src/middleware/auth');
const { googleAuth, logout } = require('../src/controllers/authController');
const { trackOrder } = require('../src/controllers/orderController');

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
  set(name, value) { this[name] = value; return this; },
  clearCookie(name) { this.clearedCookie = name; return this; },
  end() { return this; }
});
const session = () => ({
  regenerate(callback) { this.regenerated = true; callback(); },
  save(callback) { this.saved = true; callback(); },
  destroy(callback) { this.destroyed = true; callback(); }
});

test('Google authentication policy', async context => {
  await context.test('rejects demo login and caller-supplied roles', async () => {
    for (const body of [{ demoRole: 'admin' }, { idToken: 'token', role: 'admin' }, { idToken: 'token', demoEmail: 'victim@example.com' }, {}]) {
      const res = response();
      await googleAuth({ body }, res);
      assert.equal(res.statusCode, 400);
    }
    assert.equal(users.length, 0);
  });

  await context.test('rejects invalid tokens', async () => {
    OAuth2Client.prototype.verifyIdToken = async () => { throw new Error('Invalid token'); };
    const res = response();
    await googleAuth({ body: { idToken: 'invalid' } }, res);
    assert.equal(res.statusCode, 401);
  });

  await context.test('rejects unverified email claims', async () => {
    OAuth2Client.prototype.verifyIdToken = async () => ({ getPayload: () => ({ sub: 'google-123', email: 'person@example.com', email_verified: false }) });
    await assert.rejects(auth.verifyGoogleToken('token'), /verified Google email/);
  });

  await context.test('creates only customers and rotates the session after verified sign-in', async () => {
    OAuth2Client.prototype.verifyIdToken = async options => {
      assert.equal(options.audience, process.env.GOOGLE_CLIENT_ID);
      return { getPayload: () => ({ sub: 'google-123', email: 'person@example.com', email_verified: true, name: 'Person' }) };
    };
    const req = { body: { idToken: 'verified' }, session: session() };
    const res = response();
    await googleAuth(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.user.role, 'customer');
    assert.equal(res.body.token, undefined);
    assert.equal(req.session.googleID, 'google-123');
    assert.equal(req.session.regenerated, true);
    assert.equal(req.session.saved, true);
  });

  await context.test('does not merge identities by email', async () => {
    OAuth2Client.prototype.verifyIdToken = async () => ({ getPayload: () => ({ sub: 'different-google-id', email: 'person@example.com', email_verified: true }) });
    const res = response();
    await googleAuth({ body: { idToken: 'verified' }, session: session() }, res);
    assert.equal(res.statusCode, 409);
    assert.equal(users.length, 1);
  });

  await context.test('rejects legacy bearer tokens and missing sessions', async () => {
    const res = response();
    await auth.authenticate({ headers: { authorization: 'Bearer old-demo-token' } }, res, () => assert.fail('Must reject'));
    assert.equal(res.statusCode, 401);
  });

  await context.test('uses the current database role for authorization', async () => {
    const req = { session: { userID: '1', googleID: 'google-123', role: 'admin' } };
    await auth.authenticate(req, response(), () => {});
    const res = response();
    auth.authorize('admin')(req, res, () => assert.fail('Customer cannot access admin'));
    assert.equal(res.statusCode, 403);
    users[0].role = 'admin';
    let allowed = false;
    await auth.authenticate(req, response(), () => {});
    auth.authorize('admin')(req, response(), () => { allowed = true; });
    assert.equal(allowed, true);
  });

  await context.test('allows guests but rejects stale authenticated sessions', async () => {
    let allowed = false;
    await auth.optionalAuth({}, response(), () => { allowed = true; });
    assert.equal(allowed, true);
    const res = response();
    await auth.optionalAuth({ session: { userID: 'missing', googleID: 'missing' } }, res, () => assert.fail('Must reject'));
    assert.equal(res.statusCode, 401);
  });

  await context.test('logout destroys the session and clears its cookie', () => {
    const req = { session: session() };
    const res = response();
    logout(req, res);
    assert.equal(req.session.destroyed, true);
    assert.equal(res.clearedCookie, 'booknest.sid');
    assert.equal(res.statusCode, 204);
  });

  await context.test('missing Google configuration fails closed', async () => {
    const previousClientID = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = '';
    delete require.cache[require.resolve('../src/middleware/auth')];
    const unconfigured = require('../src/middleware/auth');
    await assert.rejects(unconfigured.verifyGoogleToken('anything'), error => error.status === 503);
    process.env.GOOGLE_CLIENT_ID = previousClientID;
  });

  await context.test('guest tracking requires both order ID and email', async () => {
    const missing = response();
    trackingQuery = null;
    await trackOrder({ method: 'POST', body: { orderID: 'test-order' } }, missing);
    assert.equal(missing.statusCode, 400);
    assert.equal(trackingQuery, null);
    const res = response();
    await trackOrder({ method: 'POST', body: { orderID: 'test-order', email: 'buyer@example.com' } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(trackingQuery.where, { orderID: 'test-order', guestEmail: 'buyer@example.com' });
    assert.deepEqual(trackingQuery.attributes, ['orderID', 'status', 'createdAt']);
    assert.equal(trackingQuery.include[1].attributes.includes('notes'), false);
    assert.equal(res['Cache-Control'], 'no-store');
  });

  await context.test('signed-in tracking without email is scoped to the owner', async () => {
    await trackOrder({ method: 'POST', body: { orderID: 'test-order' }, user: { userID: 'owner', role: 'customer' } }, response());
    assert.deepEqual(trackingQuery.where, { orderID: 'test-order', userID: 'owner' });
  });
});