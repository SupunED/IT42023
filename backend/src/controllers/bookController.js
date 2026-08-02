const { Op } = require('sequelize');
const { Book, Category, Review, User } = require('../models');

/**
 * Get all books with search, filtering, sorting, and pagination
 */
const getBooks = async (req, res) => {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      inStock,
      lendable,
      featured,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const whereClause = {};

    // Search by title, author, or description
    if (q) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { author: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } }
      ];
    }

    // Filter by category slug or catID
    if (category && category !== 'all') {
      if (!isNaN(category)) {
        whereClause.categoryID = parseInt(category);
      } else {
        const cat = await Category.findOne({ where: { slug: category } });
        if (cat) {
          whereClause.categoryID = cat.catID;
        }
      }
    }

    // Filter by Price range
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
    }

    // Filter by In-Stock
    if (inStock === 'true') {
      whereClause.stock = { [Op.gt]: 0 };
    }

    // Filter by Lendable stock
    if (lendable === 'true') {
      whereClause.lendableStock = { [Op.gt]: 0 };
    }

    // Filter by Featured
    if (featured === 'true') {
      whereClause.isFeatured = true;
    }

    // Sort order
    let orderClause = [['createdAt', 'DESC']];
    if (sort === 'price_asc') orderClause = [['price', 'ASC']];
    if (sort === 'price_desc') orderClause = [['price', 'DESC']];
    if (sort === 'rating') orderClause = [['rating', 'DESC']];
    if (sort === 'title_asc') orderClause = [['title', 'ASC']];

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: books } = await Book.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['catID', 'name', 'slug']
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: offset
    });

    return res.status(200).json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      books
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return res.status(500).json({ message: 'Failed to retrieve books', error: error.message });
  }
};

/**
 * Get single book details by ID
 */
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['catID', 'name', 'slug', 'description']
        },
        {
          model: Review,
          as: 'reviews',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'avatarUrl']
            }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json({ book });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve book details', error: error.message });
  }
};

/**
 * Get all categories with book counts
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Book, as: 'books', attributes: ['bookID'] }]
    });

    const formatted = categories.map(cat => ({
      catID: cat.catID,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      bookCount: cat.books ? cat.books.length : 0
    }));

    return res.status(200).json({ categories: formatted });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve categories', error: error.message });
  }
};

/**
 * Add a review for a book
 */
const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userID = req.user.userID;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    const review = await Review.create({
      userID,
      bookID: id,
      rating: parseInt(rating),
      comment
    });

    // Recalculate book average rating
    const allReviews = await Review.findAll({ where: { bookID: id } });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Book.update(
      {
        rating: parseFloat(avgRating.toFixed(1)),
        reviewCount: allReviews.length
      },
      { where: { bookID: id } }
    );

    return res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add review', error: error.message });
  }
};

module.exports = {
  getBooks,
  getBookById,
  getCategories,
  addReview
};
