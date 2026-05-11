const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvoiceItem = sequelize.define('InvoiceItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    invoice_id: { type: DataTypes.INTEGER, allowNull: false },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    product_id: { type: DataTypes.INTEGER },
    product_name: { type: DataTypes.STRING(200), allowNull: false },
    product_description: { type: DataTypes.TEXT },
    hsn_code: { type: DataTypes.STRING(10) },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 1 },
    unit: { type: DataTypes.STRING(20), defaultValue: 'pcs' },
    rate: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.00 },
    discount_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.00 },
    discount_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    taxable_amount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0.00 },
    gst_rate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 18.00 },
    cgst_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    sgst_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    igst_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    total_amount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0.00 }
}, {
    tableName: 'invoice_items',
    timestamps: false
});

// Instance method
InvoiceItem.prototype.get_gross_amount = function() {
    return this.quantity * this.rate;
};

module.exports = InvoiceItem;
