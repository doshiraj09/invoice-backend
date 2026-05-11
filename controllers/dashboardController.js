const { Customer, Product, Invoice, User } = require('../models');
const { Op } = require('sequelize');

exports.getDashboardData = async (req, res) => {
    try {
        // Get counts
        const totalCustomers = await Customer.count();
        const totalProducts = await Product.count();
        const totalInvoices = await Invoice.count();
        const activeUsers = await User.count({ where: { role: { [Op.ne]: 'pending' } } });

        const invoiceDraft = await Invoice.count({ where: { status: 'draft' } });
        const invoiceSent = await Invoice.count({ where: { status: 'sent' } });
        const invoicePaid = await Invoice.count({ where: { status: 'paid' } });
        const invoiceCancelled = await Invoice.count({ where: { status: 'cancelled' } });

        const paidInvoices = await Invoice.findAll({ where: { status: 'paid' } });
        const sentInvoices = await Invoice.findAll({ where: { status: 'sent' } });

        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.grand_total || 0), 0);
        const pendingAmount = sentInvoices.reduce((sum, inv) => sum + parseFloat(inv.grand_total || 0), 0);

        const stats = {
            total_revenue: totalRevenue,
            total_invoices: totalInvoices,
            total_customers: totalCustomers,
            active_users: activeUsers,
            invoice_draft: invoiceDraft,
            invoice_sent: invoiceSent,
            invoice_paid: invoicePaid,
            invoice_cancelled: invoiceCancelled,
            pending_amount: pendingAmount,
            total_unpaid_count: invoiceSent,
            my_drafts_count: invoiceDraft
        };

        // Recent invoices (last 8)
        const recentInvoices = await Invoice.findAll({
            order: [['createdAt', 'DESC']],
            limit: 8,
            include: [{ model: Customer }]
        });

        // Draft invoices (last 5)
        const draftInvoices = await Invoice.findAll({
            where: { status: 'draft' },
            order: [['createdAt', 'DESC']],
            limit: 5,
            include: [{ model: Customer }]
        });

        // Unpaid invoices
        const unpaidInvoices = await Invoice.findAll({
            where: { status: 'sent' },
            order: [['createdAt', 'ASC']],
            limit: 5,
            include: [{ model: Customer }]
        });

        // Top products
        const topProducts = await Product.findAll({ limit: 5 });

        // Pending users
        const pendingUsers = await User.findAll({ where: { role: 'pending' } });

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
        const totalCustomers = await Customer.count();
        const totalProducts = await Product.count();
        const totalInvoices = await Invoice.count();
        
        const allInvoices = await Invoice.findAll({ where: { status: { [Op.ne]: 'cancelled' } } });
        const totalRevenue = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.grand_total || 0), 0);
        
        const totalPendingInvoices = await Invoice.count({ where: { status: 'draft' } });

        res.json({
            totalCustomers,
            totalProducts,
            totalInvoices,
            totalPendingInvoices,
            totalRevenue: parseFloat(totalRevenue.toFixed(2))
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
        const snapshot = await db.collection('users').where('role', '==', 'pending').get();
        const pendingUsers = snapshot.docs.map(d => {
            const data = d.data();
            delete data.password_hash;
            return data;
        });
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /api/dashboard/low-stock
exports.getLowStockProducts = async (req, res) => {
    try {
        const snapshot = await db.collection('products').get();
        const products = snapshot.docs.map(d => d.data());
        const lowStock = products
            .filter(p => p.current_stock <= (p.min_stock_level || 0))
            .slice(0, 10);
        res.json(lowStock);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
