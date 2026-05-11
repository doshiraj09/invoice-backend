const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// GET unified dashboard data
router.get('/', protect, dashboardController.getDashboardData);

// Keep old routes just in case
router.get('/stats', protect, dashboardController.getStats);
router.get('/recent-invoices', protect, dashboardController.getRecentInvoices);
router.get('/pending-approvals', protect, dashboardController.getPendingApprovals);
router.get('/low-stock', protect, dashboardController.getLowStockProducts);

module.exports = router;
