const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');
const dotenv = require('dotenv');

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Verify Google ID Token
 */
const verifyGoogleToken = async (idToken) => {
  if (!GOOGLE_CLIENT_ID) {
    const error = new Error('Google sign-in is not configured.');
    error.status = 503;
    throw error;
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new Error('A verified Google email is required.');
  }
  return payload;
};

/**
 * Middleware to authenticate requests using a server-side Google session
 */
const authenticate = async (req, res, next) => {
  try {
    if (!req.session?.userID || !req.session.googleID) {
      return res.status(401).json({ message: 'Please sign in with Google.' });
    }
    const user = await User.findByPk(req.session.userID);
    if (!user || user.googleID !== req.session.googleID) {
      return res.status(401).json({ message: 'Your session is no longer valid.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(503).json({ message: 'Unable to verify your session. Please try again.' });
  }
};

/**
 * Middleware for optional authentication (e.g. for guest checkout or public endpoints)
 */
const optionalAuth = async (req, res, next) => {
  if (req.session?.userID) {
    return authenticate(req, res, next);
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
  verifyGoogleToken,
  authenticate,
  optionalAuth,
  authorize
};
