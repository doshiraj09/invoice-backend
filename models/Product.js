const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_code: { type: DataTypes.STRING(20), unique: true, allowNull: false },
    product_name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT },
    category: { type: DataTypes.STRING(100) },
    hsn_code: { type: DataTypes.STRING(10) },
    gst_rate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 18.00 },
    unit_of_measurement: { type: DataTypes.STRING(20), defaultValue: 'pcs' },
    selling_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.00 },
    purchase_price: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    default_discount: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.00 },
    mrp: { type: DataTypes.DECIMAL(12, 2) },
    current_stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    min_stock_level: { type: DataTypes.INTEGER, defaultValue: 0 },
    reorder_quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    brand: { type: DataTypes.STRING(100) },
    image_path: { type: DataTypes.STRING(300) },
    notes: { type: DataTypes.TEXT },
    status: { type: DataTypes.STRING(15), defaultValue: 'active' }
}, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Instance methods
Product.prototype.get_profit_margin = function() {
    if (this.purchase_price && this.purchase_price > 0) {
        return ((this.selling_price - this.purchase_price) / this.purchase_price) * 100;
    }
    return 0;
};

Product.prototype.is_low_stock = function() {
    return this.current_stock <= this.min_stock_level;
};

module.exports = Product;
