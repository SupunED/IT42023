const { sequelize, User, Category, Book, Review } = require('../models');

const seedDatabase = async () => {
  try {
    console.log('🔄 Syncing database tables...');
    await sequelize.sync({ force: true });
    console.log('✅ Database tables synchronized.');

    // 1. Seed Categories
    console.log('🌱 Seeding Categories...');
    const categories = await Category.bulkCreate([
      { name: 'Fiction & Literature', slug: 'fiction', description: 'Timeless classics, modern drama, and literary fiction', icon: 'BookOpen' },
      { name: 'Sci-Fi & Fantasy', slug: 'sci-fi-fantasy', description: 'Epic fantasy, space odysseys, and futuristic speculative fiction', icon: 'Sparkles' },
      { name: 'Technology & Computing', slug: 'technology', description: 'Software engineering, artificial intelligence, cloud architecture, and web development', icon: 'Cpu' },
      { name: 'Business & Leadership', slug: 'business', description: 'Entrepreneurship, economics, investing, and team leadership', icon: 'TrendingUp' },
      { name: 'Psychology & Self-Help', slug: 'psychology', description: 'Personal growth, cognitive psychology, habits, and mindfulness', icon: 'Brain' },
      { name: 'Academic & Science', slug: 'academic', description: 'Mathematics, physics, biology, research, and university textbooks', icon: 'GraduationCap' }
    ]);

    // 2. Seed Users
    console.log('🌱 Seeding Users (Admin & Customers)...');
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@booknest.com',
      role: 'admin',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      phone: '+1 (555) 019-2834',
      address: '100 Azure Cloud Way, Suite 400, Seattle, WA 98101'
    });

    const customerUser = await User.create({
      name: 'Eleanor Vance',
      email: 'eleanor@example.com',
      role: 'customer',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      phone: '+1 (555) 349-8821',
      address: '742 Evergreen Terrace, Springfield, OR 97477'
    });

    // 3. Seed Books
    console.log('🌱 Seeding Rich Book Collection...');
    const catMap = categories.reduce((acc, cat) => {
      acc[cat.slug] = cat.catID;
      return acc;
    }, {});

    const books = await Book.bulkCreate([
      {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        isbn: '978-1449373320',
        categoryID: catMap['technology'],
        price: 49.99,
        stock: 18,
        lendableStock: 5,
        lendingPricePerWeek: 4.99,
        coverPhotoUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
        description: 'The definitive guide to the architecture, algorithms, and trade-offs of modern distributed systems, data storage, and processing pipelines.',
        rating: 4.9,
        reviewCount: 42,
        isAvailable: true,
        isFeatured: true
      },
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        categoryID: catMap['technology'],
        price: 39.50,
        stock: 24,
        lendableStock: 8,
        lendingPricePerWeek: 3.99,
        coverPhotoUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80',
        description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. Master formatting, refactoring, and test-driven craftsmanship.',
        rating: 4.8,
        reviewCount: 65,
        isAvailable: true,
        isFeatured: true
      },
      {
        title: 'Dune: The Graphic Novel & Epic Saga',
        author: 'Frank Herbert',
        isbn: '978-0441013593',
        categoryID: catMap['sci-fi-fantasy'],
        price: 26.99,
        stock: 14,
        lendableStock: 4,
        lendingPricePerWeek: 2.99,
        coverPhotoUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
        description: 'Set on the desert planet Arrakis, Dune tells the story of Paul Atreides as he navigates political betrayal, gigantic sandworms, and the mysterious spice melange.',
        rating: 4.9,
        reviewCount: 128,
        isAvailable: true,
        isFeatured: true
      },
      {
        title: 'Atomic Habits: Tiny Changes, Remarkable Results',
        author: 'James Clear',
        isbn: '978-0735211292',
        categoryID: catMap['psychology'],
        price: 21.99,
        stock: 35,
        lendableStock: 12,
        lendingPricePerWeek: 2.49,
        coverPhotoUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=80',
        description: 'A proven framework for improving every day. Learn how small changes compound into life-altering personal and professional transformations.',
        rating: 4.9,
        reviewCount: 210,
        isAvailable: true,
        isFeatured: true
      },
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '978-0743273565',
        categoryID: catMap['fiction'],
        price: 15.99,
        stock: 20,
        lendableStock: 6,
        lendingPricePerWeek: 1.99,
        coverPhotoUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80',
        description: 'The classic story of the fabulously wealthy Jay Gatsby and his unrequited love for the beautiful Daisy Buchanan on Long Island during the Roaring Twenties.',
        rating: 4.7,
        reviewCount: 94,
        isAvailable: true,
        isFeatured: false
      },
      {
        title: 'Zero to One: Notes on Startups, or How to Build the Future',
        author: 'Peter Thiel with Blake Masters',
        isbn: '978-0804139298',
        categoryID: catMap['business'],
        price: 24.50,
        stock: 15,
        lendableStock: 3,
        lendingPricePerWeek: 2.99,
        coverPhotoUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
        description: 'The great secret of our time is that there are still uncharted frontiers to explore and new inventions to create. Learn how to discover singular, monopoly businesses.',
        rating: 4.6,
        reviewCount: 52,
        isAvailable: true,
        isFeatured: false
      },
      {
        title: 'Deep Learning with Python (Second Edition)',
        author: 'François Chollet',
        isbn: '978-1617296864',
        categoryID: catMap['technology'],
        price: 54.99,
        stock: 10,
        lendableStock: 3,
        lendingPricePerWeek: 5.49,
        coverPhotoUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
        description: 'Written by the creator of Keras, this book introduces deep learning using Python and the powerful Keras library with practical, intuitive explanations.',
        rating: 4.9,
        reviewCount: 38,
        isAvailable: true,
        isFeatured: false
      },
      {
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        isbn: '978-0374533557',
        categoryID: catMap['psychology'],
        price: 19.99,
        stock: 19,
        lendableStock: 5,
        lendingPricePerWeek: 2.49,
        coverPhotoUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
        description: 'Nobel laureate Daniel Kahneman takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think: System 1 and System 2.',
        rating: 4.8,
        reviewCount: 88,
        isAvailable: true,
        isFeatured: false
      }
    ]);

    // 4. Seed Initial Reviews
    console.log('🌱 Seeding Reviews...');
    await Review.create({
      userID: customerUser.userID,
      bookID: books[0].bookID,
      rating: 5,
      comment: 'An indispensable masterpiece for any engineer building scalable cloud systems!',
      isApproved: true
    });

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase().then(() => {
    console.log('Done!');
    process.exit(0);
  });
}

module.exports = seedDatabase;
