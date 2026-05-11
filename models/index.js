const { sequelize } = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Customer = require('./Customer');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const CompanySettings = require('./CompanySettings');

// Relationships
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id', as: 'items' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });

Invoice.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(Invoice, { foreignKey: 'customer_id' });

InvoiceItem.belongsTo(Product, { foreignKey: 'product_id' });
Product.hasMany(InvoiceItem, { foreignKey: 'product_id' });

module.exports = {
    sequelize,
    User,
    Product,
    Customer,
    Invoice,
    InvoiceItem,
    CompanySettings
};
