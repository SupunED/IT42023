const { User, Order, Lending, Book } = require('../models');
const { verifyGoogleToken } = require('../middleware/auth');

/**
 * Handle Google OAuth Sign-In or Sign-Up
 */
const googleAuth = async (req, res) => {
  const { idToken, ...extraFields } = req.body || {};
  if (typeof idToken !== 'string' || !idToken.trim() || Object.keys(extraFields).length) {
    return res.status(400).json({ message: 'Only a Google ID token is accepted.' });
  }

  let payload;
  try {
    payload = await verifyGoogleToken(idToken);
  } catch (error) {
    return res.status(error.status === 503 ? 503 : 401).json({
      message: error.status === 503 ? 'Google sign-in is not configured.' : 'Google sign-in could not be verified.'
    });
  }

  try {
    let user = await User.findOne({ where: { googleID: payload.sub } });
    if (!user) {
      const existingEmail = await User.findOne({ where: { email: payload.email } });
      if (existingEmail) {
        return res.status(409).json({ message: 'This email belongs to another account. Contact the administrator.' });
      }
      user = await User.create({
        googleID: payload.sub,
        name: payload.name || payload.email,
        email: payload.email,
        avatarUrl: payload.picture,
        role: 'customer'
      });
    }

    await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    req.session.userID = user.userID;
    req.session.googleID = user.googleID;
    await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));

    return res.status(200).json({
      message: 'Authentication successful',
      user: {
        userID: user.userID,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ message: 'Unable to sign in. Please try again.' });
  }
};

const logout = (req, res) => {
  req.session.destroy(error => {
    if (error) return res.status(500).json({ message: 'Unable to sign out. Please try again.' });
    res.clearCookie('booknest.sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    return res.status(204).end();
  });
};

/**
 * Get current logged in user profile with recent orders and lendings
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userID, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Order,
          as: 'orders',
          limit: 10,
          order: [['createdAt', 'DESC']]
        },
        {
          model: Lending,
          as: 'lendings',
          include: [{ model: Book, as: 'book', attributes: ['bookID', 'title', 'coverPhotoUrl', 'author'] }],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve profile', error: error.message });
  }
};

/**
 * Update Profile details
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, avatarUrl } = req.body;
    const user = await User.findByPk(req.user.userID);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (avatarUrl) user.avatarUrl = avatarUrl;

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        userID: user.userID,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

module.exports = {
  googleAuth,
  logout,
  getProfile,
  updateProfile
};
