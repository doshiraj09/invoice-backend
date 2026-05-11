/**
 * MySQL → Firebase Firestore Migration Script
 * 
 * USAGE: 
 *   1. Place your serviceAccountKey.json in /config/
 *   2. Make sure MySQL is still running
 *   3. Run: node scripts/migrate-to-firebase.js
 * 
 * This script reads ALL data from MySQL and writes it to Firestore collections.
 */

const { Sequelize, Op } = require('sequelize');
const admin = require('firebase-admin');
const path = require('path');

// ─── MySQL Connection (old database) ───────────────────────
const sequelize = new Sequelize('sikko_industries_db', 'root', 'root#123', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

// ─── Firebase Connection (new database) ────────────────────
const serviceAccount = require('../config/serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ─── Table definitions for raw reads ───────────────────────
async function readTable(tableName) {
    const [rows] = await sequelize.query(`SELECT * FROM ${tableName}`);
    return rows;
}

// ─── Migration Functions ───────────────────────────────────

async function migrateUsers() {
    console.log('\n📦 Migrating Users...');
    const users = await readTable('users');
    const batch = db.batch();
    const idMap = {};
    
    for (const user of users) {
        const docRef = db.collection('users').doc(String(user.id));
        idMap[user.id] = String(user.id);
        batch.set(docRef, {
            id: user.id,
            username: user.username || '',
            email: user.email || '',
            password_hash: user.password_hash || '',
            full_name: user.full_name || '',
            role: user.role || 'sales',
            emp_id: user.emp_id || '',
            designation: user.designation || '',
            is_active_user: user.is_active_user ? true : false,
            last_login: user.last_login ? new Date(user.last_login) : null,
            created_at: user.created_at ? new Date(user.created_at) : new Date(),
            updated_at: user.updated_at ? new Date(user.updated_at) : new Date()
        });
    }
    
    await batch.commit();
    console.log(`   ✅ Migrated ${users.length} users`);
    
    // Store the max ID for auto-increment
    const maxId = users.reduce((max, u) => Math.max(max, u.id), 0);
    await db.collection('counters').doc('users').set({ current: maxId });
    
    return idMap;
}

async function migrateCustomers() {
    console.log('\n📦 Migrating Customers...');
    const customers = await readTable('customers');
    
    // Firestore batch writes are limited to 500 operations
    const chunks = [];
    for (let i = 0; i < customers.length; i += 400) {
        chunks.push(customers.slice(i, i + 400));
    }
    
    for (const chunk of chunks) {
        const batch = db.batch();
        for (const c of chunk) {
            const docRef = db.collection('customers').doc(String(c.id));
            batch.set(docRef, {
                id: c.id,
                customer_code: c.customer_code || '',
                company_name: c.company_name || '',
                contact_person: c.contact_person || '',
                designation: c.designation || '',
                phone_primary: c.phone_primary || '',
                phone_alternate: c.phone_alternate || '',
                whatsapp_number: c.whatsapp_number || '',
                email: c.email || '',
                gstin: c.gstin || '',
                pan_number: c.pan_number || '',
                state_code: c.state_code || '',
                billing_street: c.billing_street || '',
                billing_city: c.billing_city || '',
                billing_state: c.billing_state || '',
                billing_pincode: c.billing_pincode || '',
                shipping_same_as_billing: c.shipping_same_as_billing ? true : false,
                shipping_street: c.shipping_street || '',
                shipping_city: c.shipping_city || '',
                shipping_state: c.shipping_state || '',
                shipping_pincode: c.shipping_pincode || '',
                payment_terms: c.payment_terms || 'Net 30',
                credit_limit: parseFloat(c.credit_limit) || 0,
                credit_period_days: c.credit_period_days || 30,
                customer_type: c.customer_type || 'regular',
                opening_balance: parseFloat(c.opening_balance) || 0,
                notes: c.notes || '',
                status: c.status || 'active',
                created_at: c.created_at ? new Date(c.created_at) : new Date(),
                updated_at: c.updated_at ? new Date(c.updated_at) : new Date()
            });
        }
        await batch.commit();
    }
    
    console.log(`   ✅ Migrated ${customers.length} customers`);
    const maxId = customers.reduce((max, c) => Math.max(max, c.id), 0);
    await db.collection('counters').doc('customers').set({ current: maxId });
}

async function migrateProducts() {
    console.log('\n📦 Migrating Products...');
    const products = await readTable('products');
    
    const chunks = [];
    for (let i = 0; i < products.length; i += 400) {
        chunks.push(products.slice(i, i + 400));
    }
    
    for (const chunk of chunks) {
        const batch = db.batch();
        for (const p of chunk) {
            const docRef = db.collection('products').doc(String(p.id));
            batch.set(docRef, {
                id: p.id,
                product_code: p.product_code || '',
                product_name: p.product_name || '',
                description: p.description || '',
                category: p.category || '',
                hsn_code: p.hsn_code || '',
                gst_rate: parseFloat(p.gst_rate) || 18,
                unit_of_measurement: p.unit_of_measurement || 'pcs',
                selling_price: parseFloat(p.selling_price) || 0,
                purchase_price: parseFloat(p.purchase_price) || 0,
                default_discount: parseFloat(p.default_discount) || 0,
                mrp: parseFloat(p.mrp) || 0,
                current_stock: parseInt(p.current_stock) || 0,
                min_stock_level: parseInt(p.min_stock_level) || 0,
                reorder_quantity: parseInt(p.reorder_quantity) || 0,
                brand: p.brand || '',
                image_path: p.image_path || '',
                notes: p.notes || '',
                status: p.status || 'active',
                created_at: p.created_at ? new Date(p.created_at) : new Date(),
                updated_at: p.updated_at ? new Date(p.updated_at) : new Date()
            });
        }
        await batch.commit();
    }
    
    console.log(`   ✅ Migrated ${products.length} products`);
    const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
    await db.collection('counters').doc('products').set({ current: maxId });
}

async function migrateInvoices() {
    console.log('\n📦 Migrating Invoices...');
    const invoices = await readTable('invoices');
    
    const chunks = [];
    for (let i = 0; i < invoices.length; i += 400) {
        chunks.push(invoices.slice(i, i + 400));
    }
    
    for (const chunk of chunks) {
        const batch = db.batch();
        for (const inv of chunk) {
            const docRef = db.collection('invoices').doc(String(inv.id));
            batch.set(docRef, {
                id: inv.id,
                invoice_number: inv.invoice_number || '',
                invoice_type: inv.invoice_type || 'proforma',
                invoice_date: inv.invoice_date || '',
                due_date: inv.due_date || '',
                customer_id: inv.customer_id,
                customer_name: inv.customer_name || '',
                customer_gstin: inv.customer_gstin || '',
                customer_state_code: inv.customer_state_code || '',
                billing_address: inv.billing_address || '',
                shipping_address: inv.shipping_address || '',
                seller_state_code: inv.seller_state_code || '',
                subtotal: parseFloat(inv.subtotal) || 0,
                discount_amount: parseFloat(inv.discount_amount) || 0,
                taxable_amount: parseFloat(inv.taxable_amount) || 0,
                cgst_amount: parseFloat(inv.cgst_amount) || 0,
                sgst_amount: parseFloat(inv.sgst_amount) || 0,
                igst_amount: parseFloat(inv.igst_amount) || 0,
                total_tax: parseFloat(inv.total_tax) || 0,
                round_off: parseFloat(inv.round_off) || 0,
                grand_total: parseFloat(inv.grand_total) || 0,
                amount_in_words: inv.amount_in_words || '',
                notes: inv.notes || '',
                terms_and_conditions: inv.terms_and_conditions || '',
                payment_terms: inv.payment_terms || '',
                status: inv.status || 'draft',
                created_by_name: inv.created_by_name || '',
                created_by_designation: inv.created_by_designation || '',
                created_by_emp_id: inv.created_by_emp_id || '',
                created_at: inv.created_at ? new Date(inv.created_at) : new Date(),
                updated_at: inv.updated_at ? new Date(inv.updated_at) : new Date()
            });
        }
        await batch.commit();
    }
    
    console.log(`   ✅ Migrated ${invoices.length} invoices`);
    const maxId = invoices.reduce((max, i) => Math.max(max, i.id), 0);
    await db.collection('counters').doc('invoices').set({ current: maxId });
}

async function migrateInvoiceItems() {
    console.log('\n📦 Migrating Invoice Items...');
    const items = await readTable('invoice_items');
    
    const chunks = [];
    for (let i = 0; i < items.length; i += 400) {
        chunks.push(items.slice(i, i + 400));
    }
    
    for (const chunk of chunks) {
        const batch = db.batch();
        for (const item of chunk) {
            const docRef = db.collection('invoice_items').doc(String(item.id));
            batch.set(docRef, {
                id: item.id,
                invoice_id: item.invoice_id,
                sort_order: item.sort_order || 0,
                product_id: item.product_id,
                product_name: item.product_name || '',
                product_description: item.product_description || '',
                hsn_code: item.hsn_code || '',
                quantity: parseFloat(item.quantity) || 0,
                unit: item.unit || 'pcs',
                rate: parseFloat(item.rate) || 0,
                discount_percent: parseFloat(item.discount_percent) || 0,
                discount_amount: parseFloat(item.discount_amount) || 0,
                taxable_amount: parseFloat(item.taxable_amount) || 0,
                gst_rate: parseFloat(item.gst_rate) || 18,
                cgst_amount: parseFloat(item.cgst_amount) || 0,
                sgst_amount: parseFloat(item.sgst_amount) || 0,
                igst_amount: parseFloat(item.igst_amount) || 0,
                total_amount: parseFloat(item.total_amount) || 0
            });
        }
        await batch.commit();
    }
    
    console.log(`   ✅ Migrated ${items.length} invoice items`);
    const maxId = items.reduce((max, i) => Math.max(max, i.id), 0);
    await db.collection('counters').doc('invoice_items').set({ current: maxId });
}

async function migrateCompanySettings() {
    console.log('\n📦 Migrating Company Settings...');
    const settings = await readTable('company_settings');
    
    for (const s of settings) {
        await db.collection('company_settings').doc('main').set({
            id: s.id,
            company_name: s.company_name || '',
            tagline: s.tagline || '',
            address_line1: s.address_line1 || '',
            address_line2: s.address_line2 || '',
            city: s.city || '',
            state: s.state || '',
            pincode: s.pincode || '',
            gstin: s.gstin || '',
            pan: s.pan || '',
            state_code: s.state_code || '',
            phone: s.phone || '',
            email: s.email || '',
            website: s.website || '',
            bank_name: s.bank_name || '',
            bank_account_no: s.bank_account_no || '',
            bank_ifsc: s.bank_ifsc || '',
            bank_branch: s.bank_branch || '',
            bank_upi_id: s.bank_upi_id || '',
            logo_path: s.logo_path || '',
            invoice_prefix: s.invoice_prefix || 'SIK',
            current_invoice_number: s.current_invoice_number || 0,
            financial_year: s.financial_year || '',
            default_terms: s.default_terms || '',
            default_notes: s.default_notes || '',
            created_at: s.created_at ? new Date(s.created_at) : new Date(),
            updated_at: s.updated_at ? new Date(s.updated_at) : new Date()
        });
    }
    
    console.log(`   ✅ Migrated ${settings.length} settings record(s)`);
}

// ─── Main Migration Runner ─────────────────────────────────

async function main() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  MySQL → Firebase Firestore Migration Tool  ║');
    console.log('╚══════════════════════════════════════════════╝');
    
    try {
        // Test MySQL connection
        await sequelize.authenticate();
        console.log('\n✅ MySQL connection OK');
        
        // Run migrations in order
        await migrateUsers();
        await migrateCustomers();
        await migrateProducts();
        await migrateInvoices();
        await migrateInvoiceItems();
        await migrateCompanySettings();
        
        console.log('\n╔══════════════════════════════════════════════╗');
        console.log('║  🎉 Migration Complete! All data in Firestore ║');
        console.log('╚══════════════════════════════════════════════╝\n');
        
    } catch (error) {
        console.error('\n❌ Migration FAILED:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

main();
