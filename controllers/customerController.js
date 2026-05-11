const { Customer } = require('../models');
const { Op } = require('sequelize');

exports.getCustomers = async (req, res) => {
    try {
        const { search, status } = req.query;
        let where = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            const s = `%${search}%`;
            where[Op.or] = [
                { company_name: { [Op.like]: s } },
                { customer_code: { [Op.like]: s } },
                { contact_person: { [Op.like]: s } },
                { email: { [Op.like]: s } },
                { phone_primary: { [Op.like]: s } }
            ];
        }

        const customers = await Customer.findAll({
            where,
            order: [['id', 'DESC']]
        });

        res.json({
            customers,
            total: customers.length,
            page: 1,
            pages: 1
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.createCustomer = async (req, res) => {
    try {
        // Check for duplicate customer by company name
        if (req.body.company_name) {
            const existing = await Customer.findOne({ where: { company_name: req.body.company_name } });
            if (existing) {
                return res.status(400).json({ message: `Customer "${req.body.company_name}" already exists. Added by another user.` });
            }
        }

        // Check for duplicate by phone
        if (req.body.phone_primary) {
            const byPhone = await Customer.findOne({ where: { phone_primary: req.body.phone_primary } });
            if (byPhone) {
                return res.status(400).json({ message: `A customer with phone ${req.body.phone_primary} already exists.` });
            }
        }

        const customerData = { ...req.body };
        
        if (!customerData.customer_code) {
            // Auto-generate code
            const lastCustomer = await Customer.findOne({ order: [['id', 'DESC']] });
            const nextId = lastCustomer ? lastCustomer.id + 1 : 1;
            customerData.customer_code = `CUST-${String(nextId).padStart(4, '0')}`;
        }

        customerData.created_by_id = req.user.id;
        customerData.created_by_name = req.user.full_name || '';

        const customer = await Customer.create(customerData);
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ message: 'Error creating customer', error: error.message });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        await customer.update(req.body);
        res.json(customer);
    } catch (error) {
        res.status(400).json({ message: 'Error updating customer', error: error.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        await customer.destroy();
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Error deleting customer', error: error.message });
    }
};
