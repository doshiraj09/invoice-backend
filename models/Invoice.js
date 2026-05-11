const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invoice = sequelize.define('Invoice', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    invoice_number: { type: DataTypes.STRING(30), unique: true, allowNull: false },
    invoice_type: { type: DataTypes.STRING(20), defaultValue: 'proforma' },
    invoice_date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    due_date: { type: DataTypes.DATEONLY },
    customer_id: { type: DataTypes.INTEGER, allowNull: false },
    customer_name: { type: DataTypes.STRING(200) },
    customer_gstin: { type: DataTypes.STRING(15) },
    customer_state_code: { type: DataTypes.STRING(2) },
    billing_address: { type: DataTypes.TEXT },
    shipping_address: { type: DataTypes.TEXT },
    seller_state_code: { type: DataTypes.STRING(2) },
    subtotal: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0.00 },
    discount_amount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0.00 },
    taxable_amount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0.00 },
    cgst_amount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0.00 },
    sgst_amount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0.00 },
    igst_amount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0.00 },
    total_tax: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0.00 },
    round_off: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0.00 },
    grand_total: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0.00 },
    amount_in_words: { type: DataTypes.STRING(500) },
    notes: { type: DataTypes.TEXT },
    terms_and_conditions: { type: DataTypes.TEXT },
    payment_terms: { type: DataTypes.STRING(100) },
    status: { type: DataTypes.STRING(15), defaultValue: 'draft' },
    created_by_name: { type: DataTypes.STRING(150) },
    created_by_designation: { type: DataTypes.STRING(100) },
    created_by_emp_id: { type: DataTypes.STRING(50) },
    transporter_name: { type: DataTypes.STRING(200) },
    transport_branch: { type: DataTypes.STRING(200) }
}, {
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Instance methods
Invoice.prototype.is_igst = function() {
    return this.seller_state_code !== this.customer_state_code;
};

Invoice.prototype.get_total_items = function() {
    return this.items ? this.items.length : 0;
};

module.exports = Invoice;
