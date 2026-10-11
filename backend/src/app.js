const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { sequelize } = require('./models');
const { sessionMiddleware, sessionStore, allowedOrigins, requireTrustedOrigin, isAllowedOrigin } = require('./config/session');
const { initCronJobs } = require('./services/scheduler');

// Routes
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const lendingRoutes = require('./routes/lendingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notify } = require('./controllers/paymentController');

const app = express();
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

// Security & Middlewares
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'", 'https://accounts.google.com/gsi/client', 'https://www.payhere.lk', 'https://sandbox.payhere.lk', 'https://static.cloudflareinsights.com'],
      frameSrc: ["'self'", 'https://accounts.google.com', 'https://www.payhere.lk', 'https://sandbox.payhere.lk'],
      connectSrc: ["'self'", 'https://accounts.google.com', 'https://www.payhere.lk', 'https://sandbox.payhere.lk', 'https://cloudflareinsights.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:']
    }
  },
  crossOriginResourcePolicy: false // Allow loading local /uploads assets
}));
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
  credentials: true
}));
app.post('/api/payments/payhere/notify', express.urlencoded({ extended: false, limit: '16kb' }), notify);
app.use('/api', requireTrustedOrigin);
app.use('/api', sessionMiddleware);
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
    database: 'mysql'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/lending', lendingRoutes);
app.use('/api/admin', adminRoutes);

// Serve the built React frontend (combined hosting)
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// SPA fallback: send index.html for any non-API route
app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

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

    // Sync models (schema is imported via SQL; this only creates missing tables)
    await sequelize.sync();

    await sessionStore.sync();

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

if (require.main === module) startServer();

module.exports = app;
