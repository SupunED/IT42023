const { Lending, Book, User } = require('../models');

/**
 * Submit a book lending request
 */
const requestLending = async (req, res) => {
  try {
    const userID = req.user.userID;
    const { bookID, durationDays = 14 } = req.body;

    const book = await Book.findByPk(bookID);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.lendableStock < 1) {
      return res.status(400).json({ message: 'No lendable copies currently available for this title' });
    }

    // Check if user already has an active or pending lending for this exact book
    const existingLending = await Lending.findOne({
      where: {
        userID,
        bookID,
        status: ['Pending', 'Approved', 'Active']
      }
    });

    if (existingLending) {
      return res.status(400).json({ message: 'You already have an active or pending lending request for this book.' });
    }

    // Calculate lending fee based on weeks
    const weeks = Math.ceil(parseInt(durationDays) / 7);
    const weeklyRate = Number(book.lendingPricePerWeek) || 2.99;
    const lendingFee = parseFloat((weeks * weeklyRate).toFixed(2));

    const lending = await Lending.create({
      userID,
      bookID,
      durationDays: parseInt(durationDays),
      lendingFee,
      status: 'Pending',
      requestDate: new Date()
    });

    // Temporarily decrement available lendable copies
    book.lendableStock -= 1;
    await book.save();

    return res.status(201).json({
      message: 'Lending request submitted successfully! Awaiting library admin approval.',
      lending
    });
  } catch (error) {
    console.error('Lending request error:', error);
    return res.status(500).json({ message: 'Failed to submit lending request', error: error.message });
  }
};

/**
 * Get authenticated user's lendings
 */
const getUserLendings = async (req, res) => {
  try {
    const userID = req.user.userID;
    const lendings = await Lending.findAll({
      where: { userID },
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['bookID', 'title', 'coverPhotoUrl', 'author', 'isbn']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ lendings });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch lendings', error: error.message });
  }
};

/**
 * Customer initiates book return
 */
const initiateReturn = async (req, res) => {
  try {
    const userID = req.user.userID;
    const { lendID } = req.params;

    const lending = await Lending.findOne({
      where: { lendID, userID }
    });

    if (!lending) {
      return res.status(404).json({ message: 'Lending record not found' });
    }

    if (lending.status !== 'Active' && lending.status !== 'Overdue') {
      return res.status(400).json({ message: `Cannot initiate return for lending in '${lending.status}' status.` });
    }

    lending.status = 'Returned';
    lending.returnDate = new Date();
    await lending.save();

    // Restock lendable copy
    const book = await Book.findByPk(lending.bookID);
    if (book) {
      book.lendableStock += 1;
      await book.save();
    }

    return res.status(200).json({
      message: 'Book return recorded successfully. Thank you for returning the book!',
      lending
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to initiate return', error: error.message });
  }
};

module.exports = {
  requestLending,
  getUserLendings,
  initiateReturn
};
