const { Customer, Product, Invoice, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

exports.getDashboardData = async (req, res) => {
    try {
        // Run all independent queries in parallel instead of one-by-one
        const [
            totalCustomers,
            totalProducts,
            totalInvoices,
            activeUsers,
            invoiceDraft,
            invoiceConfirmed,
            invoiceRejected,
            revenueResult,
            pendingResult,
            recentInvoices,
            draftInvoices,
            unpaidInvoices,
            topProducts,
            pendingUsers
        ] = await Promise.all([
            Customer.count(),
            Product.count(),
            Invoice.count(),
            User.count({ where: { is_active_user: true } }),
            Invoice.count({ where: { status: 'draft' } }),
            Invoice.count({ where: { status: 'confirmed' } }),
            Invoice.count({ where: { status: 'rejected' } }),
            // Use SUM in SQL instead of fetching all rows and reducing in JS
            Invoice.findOne({
                where: { status: 'confirmed' },
                attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('grand_total')), 0), 'total']],
                raw: true
            }),
            Invoice.findOne({
                where: { status: 'draft' },
                attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('grand_total')), 0), 'total']],
                raw: true
            }),
            Invoice.findAll({
                order: [['created_at', 'DESC']],
                limit: 8,
                include: [{ model: Customer }]
            }),
            Invoice.findAll({
                where: { status: 'draft' },
                order: [['created_at', 'DESC']],
                limit: 5,
                include: [{ model: Customer }]
            }),
            Invoice.findAll({
                where: { status: 'confirmed' },
                order: [['created_at', 'ASC']],
                limit: 5,
                include: [{ model: Customer }]
            }),
            Product.findAll({ limit: 5 }),
            User.findAll({ where: { is_active_user: false } })
        ]);

        const totalRevenue = parseFloat(revenueResult?.total || 0);
        const pendingAmount = parseFloat(pendingResult?.total || 0);

        const stats = {
            total_revenue: totalRevenue,
            total_invoices: totalInvoices,
            total_customers: totalCustomers,
            active_users: activeUsers,
            invoice_draft: invoiceDraft,
            invoice_sent: invoiceConfirmed,
            invoice_paid: 0,
            invoice_cancelled: invoiceRejected,
            pending_amount: pendingAmount,
            total_unpaid_count: invoiceConfirmed,
            my_drafts_count: invoiceDraft
        };

        res.json({
            stats,
            recent_invoices: recentInvoices,
            draft_invoices: draftInvoices,
            unpaid_invoices: unpaidInvoices,
            top_products: topProducts,
            pending_users: pendingUsers
        });
    } catch (error) {
        console.error('Error in getDashboardData:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /api/dashboard/stats
exports.getStats = async (req, res) => {
    try {
        const [totalCustomers, totalProducts, totalInvoices, totalPendingInvoices, revenueResult] = await Promise.all([
            Customer.count(),
            Product.count(),
            Invoice.count(),
            Invoice.count({ where: { status: 'draft' } }),
            Invoice.findOne({
                where: { status: { [Op.ne]: 'rejected' } },
                attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('grand_total')), 0), 'total']],
                raw: true
            })
        ]);

        res.json({
            totalCustomers,
            totalProducts,
            totalInvoices,
            totalPendingInvoices,
            totalRevenue: parseFloat(parseFloat(revenueResult?.total || 0).toFixed(2))
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /api/dashboard/recent-invoices
exports.getRecentInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.findAll({
            order: [['id', 'DESC']],
            limit: 5,
            include: [{ model: Customer }]
        });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /api/dashboard/pending-approvals
exports.getPendingApprovals = async (req, res) => {
    try {
        const pendingUsers = await User.findAll({
            where: { is_active_user: false },
            attributes: { exclude: ['password_hash'] }
        });
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /api/dashboard/low-stock
exports.getLowStockProducts = async (req, res) => {
    try {
        const lowStock = await Product.findAll({
            where: sequelize.where(
                sequelize.col('current_stock'),
                Op.lte,
                sequelize.col('min_stock_level')
            ),
            limit: 10
        });
        res.json(lowStock);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
