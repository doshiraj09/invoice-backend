const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(protect, getProducts)
    .post(protect, authorize('admin', 'accountant'), createProduct);

router.route('/:id')
    .get(protect, getProductById)
    .put(protect, authorize('admin', 'accountant'), updateProduct)
    .delete(protect, authorize('admin'), deleteProduct);

module.exports = router;