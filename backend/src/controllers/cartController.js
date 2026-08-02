const { Cart, Book } = require('../models');

/**
 * Get user's cart
 */
const getCart = async (req, res) => {
  try {
    const userID = req.user.userID;
    const cartItems = await Cart.findAll({
      where: { userID },
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['bookID', 'title', 'author', 'price', 'stock', 'coverPhotoUrl', 'isAvailable']
        }
      ]
    });

    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.book ? Number(item.book.price) : 0;
      return sum + price * item.quantity;
    }, 0);

    return res.status(200).json({
      cart: cartItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      count: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve cart', error: error.message });
  }
};

/**
 * Add book to cart
 */
const addToCart = async (req, res) => {
  try {
    const userID = req.user.userID;
    const { bookID, quantity = 1 } = req.body;

    const book = await Book.findByPk(bookID);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.stock < 1) {
      return res.status(400).json({ message: 'Book is currently out of stock' });
    }

    let cartItem = await Cart.findOne({ where: { userID, bookID } });

    if (cartItem) {
      const newQty = cartItem.quantity + parseInt(quantity);
      if (newQty > book.stock) {
        return res.status(400).json({ message: `Cannot add more than available stock (${book.stock})` });
      }
      cartItem.quantity = newQty;
      await cartItem.save();
    } else {
      cartItem = await Cart.create({
        userID,
        bookID,
        quantity: Math.min(parseInt(quantity), book.stock)
      });
    }

    return res.status(200).json({ message: 'Item added to cart', cartItem });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add item to cart', error: error.message });
  }
};

/**
 * Update quantity of cart item
 */
const updateCartItem = async (req, res) => {
  try {
    const userID = req.user.userID;
    const { cartID } = req.params;
    const { quantity } = req.body;

    const cartItem = await Cart.findOne({
      where: { cartID, userID },
      include: [{ model: Book, as: 'book' }]
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    const newQty = parseInt(quantity);
    if (newQty <= 0) {
      await cartItem.destroy();
      return res.status(200).json({ message: 'Item removed from cart' });
    }

    if (newQty > cartItem.book.stock) {
      return res.status(400).json({ message: `Quantity exceeds available stock (${cartItem.book.stock})` });
    }

    cartItem.quantity = newQty;
    await cartItem.save();

    return res.status(200).json({ message: 'Cart updated', cartItem });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update cart', error: error.message });
  }
};

/**
 * Remove item from cart
 */
const removeFromCart = async (req, res) => {
  try {
    const userID = req.user.userID;
    const { cartID } = req.params;

    const cartItem = await Cart.findOne({ where: { cartID, userID } });
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await cartItem.destroy();
    return res.status(200).json({ message: 'Item removed from cart' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove item', error: error.message });
  }
};

/**
 * Sync guest local cart with user account after logging in
 */
const syncCart = async (req, res) => {
  try {
    const userID = req.user.userID;
    const { items = [] } = req.body; // Array of { bookID, quantity }

    for (const item of items) {
      const book = await Book.findByPk(item.bookID);
      if (!book || book.stock < 1) continue;

      const existing = await Cart.findOne({ where: { userID, bookID: item.bookID } });
      if (existing) {
        existing.quantity = Math.min(existing.quantity + (item.quantity || 1), book.stock);
        await existing.save();
      } else {
        await Cart.create({
          userID,
          bookID: item.bookID,
          quantity: Math.min(item.quantity || 1, book.stock)
        });
      }
    }

    return res.status(200).json({ message: 'Cart synchronized successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to sync cart', error: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  syncCart
};
