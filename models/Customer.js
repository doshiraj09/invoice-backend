const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customer_code: { type: DataTypes.STRING(20), unique: true, allowNull: false },
    company_name: { type: DataTypes.STRING(200), allowNull: false },
    contact_person: { type: DataTypes.STRING(150), allowNull: false },
    designation: { type: DataTypes.STRING(100) },
    phone_primary: { type: DataTypes.STRING(15), allowNull: false },
    phone_alternate: { type: DataTypes.STRING(15) },
    whatsapp_number: { type: DataTypes.STRING(15) },
    email: { type: DataTypes.STRING(150) },
    gstin: { type: DataTypes.STRING(15) },
    pan_number: { type: DataTypes.STRING(10) },
    state_code: { type: DataTypes.STRING(2) },
    billing_street: { type: DataTypes.STRING(300) },
    billing_city: { type: DataTypes.STRING(100) },
    billing_state: { type: DataTypes.STRING(100) },
    billing_pincode: { type: DataTypes.STRING(10) },
    shipping_same_as_billing: { type: DataTypes.BOOLEAN, defaultValue: true },
    shipping_street: { type: DataTypes.STRING(300) },
    shipping_city: { type: DataTypes.STRING(100) },
    shipping_state: { type: DataTypes.STRING(100) },
    shipping_pincode: { type: DataTypes.STRING(10) },
    payment_terms: { type: DataTypes.STRING(50), defaultValue: 'Net 30' },
    credit_limit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    credit_period_days: { type: DataTypes.INTEGER, defaultValue: 30 },
    customer_type: { type: DataTypes.STRING(20), defaultValue: 'regular' },
    opening_balance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
    notes: { type: DataTypes.TEXT },
    status: { type: DataTypes.STRING(10), defaultValue: 'active' }
}, {
    tableName: 'customers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Instance methods
Customer.prototype.get_full_billing_address = function() {
    const parts = [
        this.billing_street,
        this.billing_city,
        this.billing_state,
        this.billing_pincode
    ].filter(part => part && part.trim());
    return parts.join(', ');
};

Customer.prototype.get_full_shipping_address = function() {
    if (this.shipping_same_as_billing) {
        return this.get_full_billing_address();
    }
    const parts = [
        this.shipping_street,
        this.shipping_city,
        this.shipping_state,
        this.shipping_pincode
    ].filter(part => part && part.trim());
    return parts.join(', ');
};

module.exports = Customer;
