const crypto = require('node:crypto');

const PAYMENT_METHOD = 'PayHere Sandbox (USD)';
const CURRENCY = 'USD';
const RESERVATION_MS = 30 * 60 * 1000;
const md5 = value => crypto.createHash('md5').update(value).digest('hex').toUpperCase();

const getConfig = () => {
  const merchantID = process.env.PAYHERE_MERCHANT_ID;
  const secret = process.env.PAYHERE_MERCHANT_SECRET;
  const notifyURL = process.env.PAYHERE_NOTIFY_URL;
  let validURL = false;
  try {
    const parsed = new URL(notifyURL);
    validURL = parsed.protocol === 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  } catch {}
  if (!merchantID || !secret || !validURL) {
    const error = new Error('PayHere sandbox is not configured. Set the backend merchant credentials and public HTTPS notification URL.');
    error.status = 503;
    throw error;
  }
  return { merchantID, secret, notifyURL };
};

const secureEqual = (actual, expected) => {
  if (typeof actual !== 'string' || actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
};

const statusToken = (orderID, config = getConfig()) => crypto
  .createHmac('sha256', config.secret).update(`payhere-status:${orderID}`).digest('hex');

const verifyStatusToken = (orderID, token, config = getConfig()) =>
  typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) && secureEqual(token, statusToken(orderID, config));

const createPayment = (order, contact, config = getConfig()) => {
  const amount = Number(order.total).toFixed(2);
  const names = contact.name.trim().split(/\s+/);
  return {
    sandbox: true,
    merchant_id: config.merchantID,
    notify_url: config.notifyURL,
    order_id: order.orderID,
    items: `BookNest order ${order.orderID}`,
    currency: CURRENCY,
    amount,
    hash: md5(config.merchantID + order.orderID + amount + CURRENCY + md5(config.secret)),
    first_name: names[0],
    last_name: names.slice(1).join(' ') || names[0],
    email: contact.email,
    phone: contact.phone,
    address: contact.address,
    city: contact.city,
    country: contact.country
  };
};

const verifyNotification = (body, config = getConfig()) => {
  const required = ['merchant_id', 'order_id', 'payment_id', 'payhere_amount', 'payhere_currency', 'status_code', 'md5sig'];
  if (!body) {
    console.error('❌ [PayHere IPN] Empty notification payload');
    return false;
  }
  const missing = required.filter(field => typeof body[field] !== 'string' || !body[field] || body[field].length > 200);
  if (missing.length > 0) {
    console.error('❌ [PayHere IPN] Missing or invalid fields:', missing);
    return false;
  }
  if (body.merchant_id !== config.merchantID) {
    console.error(`❌ [PayHere IPN] Merchant ID mismatch: received "${body.merchant_id}", expected "${config.merchantID}"`);
    return false;
  }
  if (body.payhere_currency !== CURRENCY) {
    console.error(`❌ [PayHere IPN] Currency mismatch: received "${body.payhere_currency}", expected "${CURRENCY}"`);
    return false;
  }
  if (!/^\d+\.\d{2}$/.test(body.payhere_amount) || !['2', '0', '-1', '-2', '-3'].includes(body.status_code)) {
    console.error(`❌ [PayHere IPN] Invalid amount (${body.payhere_amount}) or status_code (${body.status_code})`);
    return false;
  }
  if (!/^[A-Fa-f0-9]{32}$/.test(body.md5sig)) {
    console.error('❌ [PayHere IPN] Invalid md5sig format');
    return false;
  }
  const signature = md5(body.merchant_id + body.order_id + body.payhere_amount + body.payhere_currency + body.status_code + md5(config.secret));
  const valid = secureEqual(body.md5sig.toUpperCase(), signature);
  if (!valid) {
    console.error('❌ [PayHere IPN] Signature mismatch! Check that PAYHERE_MERCHANT_SECRET matches the domain secret in PayHere.');
  }
  return valid;
};

module.exports = { PAYMENT_METHOD, CURRENCY, RESERVATION_MS, getConfig, createPayment, verifyNotification, statusToken, verifyStatusToken };