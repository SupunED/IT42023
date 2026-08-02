const { Book, Category, Order, OrderItem, Delivery, Lending, User, Review } = require('../models');
const { sendOrderStatusUpdate, sendLendingStatusNotification, sendHtmlEmail } = require('../services/emailService');
const { uploadMedia } = require('../services/azureStorage');

/**
 * Get aggregated Admin statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const totalRevenueResult = await Order.sum('total', { where: { paymentStatus: 'paid' } });
    const totalRevenue = parseFloat(totalRevenueResult || 0).toFixed(2);
    
    const totalBooks = await Book.count();
    const lowStockBooks = await Book.count({ where: { stock: { [require('sequelize').Op.lte]: 5 } } });
    
    const pendingLendings = await Lending.count({ where: { status: 'Pending' } });
    const activeLendings = await Lending.count({ where: { status: 'Active' } });
    const overdueLendings = await Lending.count({ where: { status: 'Overdue' } });
    
    const totalCustomers = await User.count({ where: { role: 'customer' } });

    // Recent 5 Orders
    const recentOrders = await Order.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: Delivery, as: 'delivery' }]
    });

    return res.status(200).json({
      stats: {
        totalRevenue,
        totalOrders,
        totalBooks,
        lowStockBooks,
        pendingLendings,
        activeLendings,
        overdueLendings,
        totalCustomers
      },
      recentOrders
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve dashboard stats', error: error.message });
  }
};

/**
 * Create a new book listing
 */
const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      categoryID,
      price,
      stock,
      lendableStock,
      lendingPricePerWeek,
      description,
      isFeatured,
      coverPhotoUrl
    } = req.body;

    let finalCoverUrl = coverPhotoUrl;

    // If an image file was uploaded via multipart/form-data
    if (req.file) {
      finalCoverUrl = await uploadMedia(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    const book = await Book.create({
      title,
      author,
      isbn,
      categoryID: parseInt(categoryID),
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      lendableStock: parseInt(lendableStock) || 0,
      lendingPricePerWeek: lendingPricePerWeek ? parseFloat(lendingPricePerWeek) : 2.99,
      description,
      coverPhotoUrl: finalCoverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isAvailable: (parseInt(stock) || 0) > 0
    });

    return res.status(201).json({ message: 'Book created successfully', book });
  } catch (error) {
    console.error('Create book error:', error);
    return res.status(500).json({ message: 'Failed to create book', error: error.message });
  }
};

/**
 * Update existing book
 */
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const {
      title,
      author,
      isbn,
      categoryID,
      price,
      stock,
      lendableStock,
      lendingPricePerWeek,
      description,
      isFeatured,
      isAvailable,
      coverPhotoUrl
    } = req.body;

    if (req.file) {
      book.coverPhotoUrl = await uploadMedia(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    } else if (coverPhotoUrl) {
      book.coverPhotoUrl = coverPhotoUrl;
    }

    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (isbn !== undefined) book.isbn = isbn;
    if (categoryID !== undefined) book.categoryID = parseInt(categoryID);
    if (price !== undefined) book.price = parseFloat(price);
    if (stock !== undefined) {
      book.stock = parseInt(stock);
      book.isAvailable = book.stock > 0;
    }
    if (lendableStock !== undefined) book.lendableStock = parseInt(lendableStock);
    if (lendingPricePerWeek !== undefined) book.lendingPricePerWeek = parseFloat(lendingPricePerWeek);
    if (description !== undefined) book.description = description;
    if (isFeatured !== undefined) book.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (isAvailable !== undefined) book.isAvailable = isAvailable === 'true' || isAvailable === true;

    await book.save();

    return res.status(200).json({ message: 'Book updated successfully', book });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update book', error: error.message });
  }
};

/**
 * Delete a book
 */
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await book.destroy();
    return res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete book', error: error.message });
  }
};

/**
 * Get all orders for Admin
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const whereClause = {};
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Book, as: 'book', attributes: ['title', 'price', 'coverPhotoUrl'] }]
        },
        {
          model: Delivery,
          as: 'delivery'
        },
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return res.status(200).json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      orders
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

/**
 * Update Order and Delivery Status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderID } = req.params;
    const { status, deliveryStatus, carrier, trackingNumber, deliveryNotes } = req.body;

    const order = await Order.findByPk(orderID, {
      include: [{ model: Delivery, as: 'delivery' }, { model: User, as: 'user' }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status) {
      order.status = status;
      await order.save();
    }

    // Update delivery record
    let delivery = order.delivery;
    if (!delivery) {
      delivery = await Delivery.create({ orderID: order.orderID });
    }

    if (deliveryStatus) delivery.status = deliveryStatus;
    if (carrier) delivery.carrier = carrier;
    if (trackingNumber) delivery.trackingNumber = trackingNumber;
    if (deliveryNotes) delivery.notes = deliveryNotes;

    if (status === 'Delivered' || deliveryStatus === 'Delivered') {
      delivery.deliveredAt = new Date();
    }

    await delivery.save();

    // Trigger status update email
    const recipientEmail = order.guestEmail || (order.user ? order.user.email : null);
    if (recipientEmail && status) {
      sendOrderStatusUpdate(order, status, recipientEmail).catch(err => console.error('Status update email error:', err));
    }

    return res.status(200).json({
      message: 'Order status updated successfully',
      order,
      delivery
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

/**
 * Get all lending requests for Admin
 */
const getAllLendings = async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = {};
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const lendings = await Lending.findAll({
      where: whereClause,
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['bookID', 'title', 'coverPhotoUrl', 'author', 'isbn']
        },
        {
          model: User,
          as: 'user',
          attributes: ['userID', 'name', 'email', 'phone', 'avatarUrl']
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
 * Approve, Reject, or Update Lending status
 */
const updateLendingStatus = async (req, res) => {
  try {
    const { lendID } = req.params;
    const { status, adminNotes } = req.body; // 'Approved', 'Rejected', 'Active', 'Returned', 'Overdue'

    const lending = await Lending.findByPk(lendID, {
      include: [{ model: Book, as: 'book' }, { model: User, as: 'user' }]
    });

    if (!lending) {
      return res.status(404).json({ message: 'Lending record not found' });
    }

    const oldStatus = lending.status;
    lending.status = status;
    if (adminNotes !== undefined) lending.adminNotes = adminNotes;

    // When approving or activating, set start and due dates
    if (status === 'Approved' || status === 'Active') {
      const now = new Date();
      lending.startDate = now;
      lending.dueDate = new Date(now.getTime() + lending.durationDays * 24 * 60 * 60 * 1000);
    } else if (status === 'Rejected' && oldStatus === 'Pending') {
      // Re-credit the book's lendable stock
      if (lending.book) {
        lending.book.lendableStock += 1;
        await lending.book.save();
      }
    } else if (status === 'Returned' && oldStatus !== 'Returned') {
      lending.returnDate = new Date();
      if (lending.book) {
        lending.book.lendableStock += 1;
        await lending.book.save();
      }
    }

    await lending.save();

    // Trigger notification email to customer
    if (lending.user && lending.user.email) {
      sendLendingStatusNotification(
        lending,
        lending.user.email,
        lending.book ? lending.book.title : 'Book',
        status
      ).catch(err => console.error('Lending email error:', err));
    }

    return res.status(200).json({
      message: `Lending request updated to ${status}`,
      lending
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update lending status', error: error.message });
  }
};

/**
 * Send manual email to a customer
 */
const sendDirectEmail = async (req, res) => {
  try {
    const { recipientEmail, subject, message } = req.body;

    if (!recipientEmail || !subject || !message) {
      return res.status(400).json({ message: 'Recipient email, subject, and message are required' });
    }

    const htmlContent = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #4f46e5; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0;">Message from BookNest Library Admin</h2>
        </div>
        <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
          <p>${message.replace(/\n/g, '<br/>')}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
          <p style="font-size: 12px; color: #64748b;">This email was sent directly by the BookNest administration team.</p>
        </div>
      </div>
    `;

    const result = await sendHtmlEmail({
      to: recipientEmail,
      subject,
      htmlContent,
      plainTextContent: message
    });

    return res.status(200).json({
      message: 'Email dispatched successfully',
      result
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  createBook,
  updateBook,
  deleteBook,
  getAllOrders,
  updateOrderStatus,
  getAllLendings,
  updateLendingStatus,
  sendDirectEmail
};
