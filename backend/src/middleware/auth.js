const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'booknest_super_secure_jwt_secret_2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Verify Google ID Token
 */
const verifyGoogleToken = async (idToken) => {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('⚠️ GOOGLE_CLIENT_ID not set. Mocking Google token payload for demo.');
    return {
      email: 'demo.user@booknest.com',
      name: 'Demo Google User',
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      sub: 'google-sub-mock-12345'
    };
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID
  });
  return ticket.getPayload();
};

/**
 * Middleware to authenticate requests via JWT Bearer token or cookie
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userID);

    if (!user) {
      return res.status(401).json({ message: 'User belonging to token no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.', error: error.message });
  }
};

/**
 * Middleware for optional authentication (e.g. for guest checkout or public endpoints)
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.userID);
      if (user) {
        req.user = user;
      }
    }
  } catch (err) {
    // Continue as guest
  }
  next();
};

/**
 * Middleware to restrict route to specific roles (e.g. 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Access restricted to roles: [${roles.join(', ')}]`
      });
    }
    next();
  };
};

module.exports = {
  JWT_SECRET,
  verifyGoogleToken,
  authenticate,
  optionalAuth,
  authorize
};
