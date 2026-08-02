const jwt = require('jsonwebtoken');
const { User, Order, Lending, Book, Review } = require('../models');
const { verifyGoogleToken, JWT_SECRET } = require('../middleware/auth');

/**
 * Handle Google OAuth Sign-In or Sign-Up
 */
const googleAuth = async (req, res) => {
  try {
    const { idToken, demoRole, demoEmail, demoName } = req.body;

    let email, name, avatarUrl, googleID;

    // Fast-track demo login support for evaluation
    if (demoRole) {
      email = demoEmail || (demoRole === 'admin' ? 'admin@booknest.com' : 'eleanor@example.com');
      name = demoName || (demoRole === 'admin' ? 'System Administrator' : 'Eleanor Vance');
      avatarUrl = demoRole === 'admin' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80';
      googleID = `demo-${demoRole}-${Date.now()}`;
    } else if (idToken) {
      const payload = await verifyGoogleToken(idToken);
      email = payload.email;
      name = payload.name;
      avatarUrl = payload.picture;
      googleID = payload.sub;
    } else {
      return res.status(400).json({ message: 'Missing Google idToken or credentials.' });
    }

    let user = await User.findOne({ where: { email } });

    if (!user) {
      user = await User.create({
        googleID,
        name,
        email,
        avatarUrl,
        role: demoRole === 'admin' ? 'admin' : 'customer'
      });
    } else if (demoRole && user.role !== demoRole) {
      user.role = demoRole;
      await user.save();
    }

    const token = jwt.sign(
      { userID: user.userID, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Authentication successful',
      token,
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
    return res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
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
  getProfile,
  updateProfile
};
