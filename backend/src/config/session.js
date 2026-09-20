const crypto = require('node:crypto');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('./database');

const production = process.env.NODE_ENV === 'production';
const configuredSecret = process.env.SESSION_SECRET;
if (production && (!configuredSecret || configuredSecret.length < 32)) {
  throw new Error('SESSION_SECRET must contain at least 32 characters in production.');
}

const allowedOrigins = new Set((process.env.APP_ORIGINS || 'http://localhost:5173,http://localhost:5000')
  .split(',').map(origin => origin.trim()).filter(Boolean));
const sessionStore = new SequelizeStore({ db: sequelize, expiration: 8 * 60 * 60 * 1000 });
const sessionMiddleware = session({
  name: 'booknest.sid',
  secret: configuredSecret || crypto.randomBytes(48).toString('hex'),
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: production,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/'
  }
});

const requireTrustedOrigin = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (!allowedOrigins.has(req.get('origin'))) {
    return res.status(403).json({ message: 'Request origin is not allowed.' });
  }
  next();
};

module.exports = { sessionMiddleware, sessionStore, allowedOrigins, requireTrustedOrigin };