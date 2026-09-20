const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAdminCategories,
  createCategory,
  deleteCategory,
  getDashboardStats,
  createBook,
  updateBook,
  deleteBook,
  getAllOrders,
  updateOrderStatus,
  getAllLendings,
  updateLendingStatus,
  sendDirectEmail
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// Setup memory storage for Multer to forward buffers to Azure Blob Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Protect all admin routes
router.use(authenticate);
router.use(authorize('admin'));

router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

// Admin Dashboard stats
router.get('/stats', getDashboardStats);

// Book catalogue management
router.post('/books', upload.single('coverImage'), createBook);
router.put('/books/:id', upload.single('coverImage'), updateBook);
router.delete('/books/:id', deleteBook);

// Orders & Delivery management
router.get('/orders', getAllOrders);
router.put('/orders/:orderID/status', updateOrderStatus);

// Lending requests management
router.get('/lendings', getAllLendings);
router.put('/lendings/:lendID/status', updateLendingStatus);

// Direct email communication
router.post('/send-email', sendDirectEmail);

module.exports = router;
