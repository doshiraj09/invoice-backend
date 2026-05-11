const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice, getInvoiceById, updateInvoice, deleteInvoice, updateStatus } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getInvoices)
    .post(protect, createInvoice);

router.route('/:id')
    .get(protect, getInvoiceById)
    .put(protect, updateInvoice)
    .delete(protect, deleteInvoice);

router.route('/:id/status')
    .put(protect, updateStatus);

module.exports = router;
