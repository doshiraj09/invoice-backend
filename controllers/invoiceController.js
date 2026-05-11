const { Invoice, InvoiceItem, Customer, Product, CompanySettings, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getInvoices = async (req, res) => {
    try {
        const { search, status } = req.query;
        let where = {};
        
        if (status) {
            where.status = status;
        }
        
        if (search) {
            const s = `%${search}%`;
            where[Op.or] = [
                { invoice_number: { [Op.like]: s } },
                { customer_name: { [Op.like]: s } }
            ];
        }

        const invoices = await Invoice.findAll({
            where,
            order: [['id', 'DESC']],
            include: [{ model: Customer }]
        });
        
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.createInvoice = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            customer_id,
            invoice_type,
            items,
            notes,
            terms_and_conditions,
            transporter_name,
            transport_branch,
            status
        } = req.body;

        const customer = await Customer.findByPk(customer_id, { transaction: t });
        if (!customer) throw new Error('Customer not found');

        let settings = await CompanySettings.findOne({ transaction: t });
        if (!settings) settings = { current_invoice_number: 0, invoice_prefix: 'SIK', financial_year: '2026-27' };

        // 1. Generate Invoice Number
        const nextNum = (settings.current_invoice_number || 0) + 1;
        const prefix = settings.invoice_prefix || 'SIK';
        const fy = settings.financial_year || '2026-27';
        const invoice_number = `${prefix}/${fy}/${String(nextNum).padStart(4, '0')}`;

        // Create invoice header
        const invoice = await Invoice.create({
            invoice_number,
            invoice_type: invoice_type || 'proforma',
            invoice_date: new Date(),
            due_date: null,
            customer_id: customer.id,
            customer_name: customer.company_name,
            customer_gstin: customer.gstin || '',
            customer_state_code: customer.state_code || '',
            billing_address: [customer.billing_street, customer.billing_city].filter(Boolean).join(', ') || '',
            shipping_address: [customer.shipping_street, customer.shipping_city].filter(Boolean).join(', ') || '',
            seller_state_code: settings.state_code || '24',
            subtotal: 0,
            discount_amount: 0,
            taxable_amount: 0,
            cgst_amount: 0,
            sgst_amount: 0,
            igst_amount: 0,
            total_tax: 0,
            round_off: 0,
            grand_total: 0,
            amount_in_words: '',
            notes: notes || settings.default_notes || '',
            terms_and_conditions: terms_and_conditions || settings.default_terms || '',
            payment_terms: '',
            status: status || 'draft',
            created_by_id: req.user.id,
            created_by_name: req.user.full_name || '',
            created_by_designation: req.user.designation || '',
            created_by_emp_id: req.user.emp_id || '',
            created_by_email: req.user.email || '',
            transporter_name: transporter_name || '',
            transport_branch: transport_branch || ''
        }, { transaction: t });

        // Create items and calc total
        let subtotal = 0;
        let total_tax = 0;

        for (const item of items) {
            const product = await Product.findByPk(item.product_id, { transaction: t });
            if (!product) throw new Error(`Product ${item.product_id} not found`);

            const quantity = parseFloat(item.quantity);
            const rate = parseFloat(item.rate || product.selling_price);
            const disc_p = parseFloat(item.discount_percent || 0);

            const amt = quantity * rate;
            const disc_amt = amt * (disc_p / 100);
            const taxable = amt - disc_amt;
            const gst_rate = parseFloat(product.gst_rate || 18);
            const tax_amt = taxable * (gst_rate / 100);

            await InvoiceItem.create({
                invoice_id: invoice.id,
                product_id: product.id,
                product_name: product.product_name,
                hsn_code: product.hsn_code || '',
                quantity,
                unit: product.unit_of_measurement || 'pcs',
                rate,
                discount_percent: disc_p,
                discount_amount: disc_amt,
                taxable_amount: taxable,
                gst_rate,
                cgst_amount: 0,
                sgst_amount: 0,
                igst_amount: 0,
                total_tax: tax_amt,
                total_amount: taxable + tax_amt
            }, { transaction: t });

            // Update product stock
            await product.update({
                current_stock: (product.current_stock || 0) - quantity
            }, { transaction: t });

            subtotal += taxable;
            total_tax += tax_amt;
        }

        // Update invoice totals
        await invoice.update({
            subtotal,
            taxable_amount: subtotal,
            total_tax,
            grand_total: Math.round(subtotal + total_tax)
        }, { transaction: t });

        if (settings.id) {
            await CompanySettings.update({ current_invoice_number: nextNum }, { where: { id: settings.id }, transaction: t });
        }

        await t.commit();
        res.status(201).json(invoice);
    } catch (error) {
        await t.rollback();
        console.error('Create invoice error:', error);
        res.status(400).json({ message: error.message });
    }
};

exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id, {
            include: [
                { model: Customer },
                { model: InvoiceItem, as: 'items', include: [Product] }
            ]
        });
        
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateInvoice = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const invoice = await Invoice.findByPk(req.params.id, { transaction: t });
        if (!invoice) throw new Error('Invoice not found');
        if (invoice.status !== 'draft') throw new Error('Only draft invoices can be edited');

        const { customer_id, invoice_type, items, notes, terms_and_conditions } = req.body;

        // Revert old stock
        const oldItems = await InvoiceItem.findAll({ where: { invoice_id: invoice.id }, transaction: t });
        for (const item of oldItems) {
            const product = await Product.findByPk(item.product_id, { transaction: t });
            if (product) {
                await product.update({
                    current_stock: (product.current_stock || 0) + parseFloat(item.quantity || 0)
                }, { transaction: t });
            }
            await item.destroy({ transaction: t });
        }

        const customer = await Customer.findByPk(customer_id, { transaction: t });
        if (!customer) throw new Error('Customer not found');

        let subtotal = 0;
        let total_tax = 0;

        for (const item of items) {
            const product = await Product.findByPk(item.product_id, { transaction: t });
            if (!product) throw new Error(`Product ${item.product_id} not found`);

            const quantity = parseFloat(item.quantity);
            const rate = parseFloat(item.rate || product.selling_price);
            const disc_p = parseFloat(item.discount_percent || 0);

            const amt = quantity * rate;
            const disc_amt = amt * (disc_p / 100);
            const taxable = amt - disc_amt;
            const gst_rate = parseFloat(product.gst_rate || 18);
            const tax_amt = taxable * (gst_rate / 100);

            await InvoiceItem.create({
                invoice_id: invoice.id,
                product_id: product.id,
                product_name: product.product_name,
                hsn_code: product.hsn_code || '',
                quantity,
                unit: product.unit_of_measurement || 'pcs',
                rate,
                discount_percent: disc_p,
                discount_amount: disc_amt,
                taxable_amount: taxable,
                gst_rate,
                cgst_amount: 0,
                sgst_amount: 0,
                igst_amount: 0,
                total_tax: tax_amt,
                total_amount: taxable + tax_amt
            }, { transaction: t });

            // Update stock
            await product.update({
                current_stock: (product.current_stock || 0) - quantity
            }, { transaction: t });

            subtotal += taxable;
            total_tax += tax_amt;
        }

        await invoice.update({
            invoice_type,
            customer_id: customer.id,
            customer_name: customer.company_name,
            customer_gstin: customer.gstin || '',
            customer_state_code: customer.state_code || '',
            billing_address: [customer.billing_street, customer.billing_city].filter(Boolean).join(', ') || '',
            shipping_address: [customer.shipping_street, customer.shipping_city].filter(Boolean).join(', ') || '',
            notes: notes || '',
            terms_and_conditions: terms_and_conditions || '',
            subtotal,
            taxable_amount: subtotal,
            total_tax,
            grand_total: Math.round(subtotal + total_tax)
        }, { transaction: t });

        await t.commit();
        res.json(invoice);
    } catch (error) {
        await t.rollback();
        res.status(400).json({ message: error.message });
    }
};

exports.deleteInvoice = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const invoice = await Invoice.findByPk(req.params.id, { transaction: t });
        if (!invoice) throw new Error('Invoice not found');

        const items = await InvoiceItem.findAll({ where: { invoice_id: invoice.id }, transaction: t });
        for (const item of items) {
            const product = await Product.findByPk(item.product_id, { transaction: t });
            if (product) {
                await product.update({
                    current_stock: (product.current_stock || 0) + parseFloat(item.quantity || 0)
                }, { transaction: t });
            }
            await item.destroy({ transaction: t });
        }

        await invoice.destroy({ transaction: t });
        
        await t.commit();
        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ message: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const newStatus = req.body.status;
        
        if ((newStatus === 'confirmed' || newStatus === 'rejected') && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admin can confirm or reject invoices' });
        }

        const allowed = { draft: ['confirmed', 'rejected'], confirmed: [], rejected: ['draft'] };
        if (allowed[invoice.status] && !allowed[invoice.status].includes(newStatus)) {
            return res.status(400).json({ message: `Cannot change from ${invoice.status} to ${newStatus}` });
        }

        await invoice.update({ status: newStatus });
        res.json(invoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
