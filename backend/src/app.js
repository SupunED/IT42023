const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { sequelize, User } = require('./models');
const seedDatabase = require('./seeders/seed');
const { initCronJobs } = require('./services/scheduler');

// Routes
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const lendingRoutes = require('./routes/lendingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading local /uploads assets
}));
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files for local image storage fallback
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'BookNest E-Commerce Platform',
    timestamp: new Date().toISOString(),
    database: process.env.DB_DIALECT || 'sqlite'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/lending', lendingRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Database Initialization and Server Launch
const startServer = async () => {
  try {
    console.log('🔄 Connecting to Database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // Auto sync schema
    await sequelize.sync({ alter: true });

    // Seed if database is empty
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('🌱 Database is empty. Running initial seeder...');
      await seedDatabase();
    }

    // Start background schedulers (overdue notifications)
    initCronJobs();

    app.listen(PORT, () => {
      console.log(`🚀 BookNest API Server running at http://localhost:${PORT}`);
      console.log(`📚 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start BookNest server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
