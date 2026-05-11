const { Product } = require('../models');
const { Op } = require('sequelize');

exports.getProducts = async (req, res) => {
    try {
        const { search, category } = req.query;
        let where = {};
        
        if (category) {
            where.category = category;
        }
        
        if (search) {
            const s = `%${search}%`;
            where[Op.or] = [
                { product_name: { [Op.like]: s } },
                { product_code: { [Op.like]: s } },
                { description: { [Op.like]: s } }
            ];
        }

        const products = await Product.findAll({
            where,
            order: [['product_name', 'ASC']]
        });

        // Get unique categories (you might want to optimize this in a real app)
        const allProducts = await Product.findAll({ attributes: ['category'] });
        const categories = [...new Set(allProducts.map(p => p.category).filter(c => c && c.trim()))];

        res.json({ products, categories });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const productData = { ...req.body };
        
        if (!productData.product_code) {
            const lastProduct = await Product.findOne({ order: [['id', 'DESC']] });
            const nextId = lastProduct ? lastProduct.id + 1 : 1;
            productData.product_code = `PRD-${String(nextId).padStart(4, '0')}`;
        }

        const product = await Product.create(productData);
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: 'Error creating product', error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        await product.update(req.body);
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: 'Error updating product', error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        await product.destroy();
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};
