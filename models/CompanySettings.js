const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CompanySettings = sequelize.define('CompanySettings', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    company_name: { type: DataTypes.STRING(200), allowNull: false, defaultValue: 'Your Company Name' },
    tagline: { type: DataTypes.STRING(200) },
    address_line1: { type: DataTypes.STRING(200) },
    address_line2: { type: DataTypes.STRING(200) },
    city: { type: DataTypes.STRING(100) },
    state: { type: DataTypes.STRING(100) },
    pincode: { type: DataTypes.STRING(10) },
    gstin: { type: DataTypes.STRING(15) },
    pan: { type: DataTypes.STRING(10) },
    state_code: { type: DataTypes.STRING(2) },
    phone: { type: DataTypes.STRING(15) },
    email: { type: DataTypes.STRING(150) },
    website: { type: DataTypes.STRING(200) },
    bank_name: { type: DataTypes.STRING(100) },
    bank_account_name: { type: DataTypes.STRING(200) },
    bank_account_no: { type: DataTypes.STRING(30) },
    bank_ifsc: { type: DataTypes.STRING(15) },
    bank_swift: { type: DataTypes.STRING(20) },
    bank_branch: { type: DataTypes.STRING(100) },
    bank_upi_id: { type: DataTypes.STRING(100) },
    upi_qr_path: { type: DataTypes.STRING(300) },
    logo_path: { type: DataTypes.STRING(300) },
    invoice_prefix: { type: DataTypes.STRING(20), defaultValue: 'SIK' },
    current_invoice_number: { type: DataTypes.INTEGER, defaultValue: 0 },
    financial_year: { type: DataTypes.STRING(10) },
    default_terms: { type: DataTypes.TEXT },
    default_notes: { type: DataTypes.TEXT }
}, {
    tableName: 'company_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Instance methods
CompanySettings.prototype.get_full_address = function() {
    const parts = [
        this.address_line1,
        this.address_line2,
        this.city,
        this.state,
        this.pincode
    ].filter(part => part && part.trim());
    return parts.join(', ');
};

CompanySettings.prototype.get_next_invoice_number = async function() {
    this.current_invoice_number = (this.current_invoice_number || 0) + 1;
    await this.save();
    const fy = this.financial_year || '2026-27';
    const prefix = this.invoice_prefix || 'SIK';
    return `${prefix}/${fy}/${String(this.current_invoice_number).padStart(4, '0')}`;
};

module.exports = CompanySettings;
