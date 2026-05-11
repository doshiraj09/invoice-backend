const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const userToJSON = (user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    emp_id: user.emp_id,
    designation: user.designation,
    is_active_user: user.is_active_user,
    last_login: user.last_login
});

// GET /api/users
exports.getUsers = async (req, res) => {
    try {
        const { search, role, page = 1, limit = 50 } = req.query;
        let where = {};
        
        if (role) {
            where.role = role;
        }
        
        if (search) {
            const s = `%${search}%`;
            where[Op.or] = [
                { full_name: { [Op.like]: s } },
                { username: { [Op.like]: s } },
                { email: { [Op.like]: s } }
            ];
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await User.findAndCountAll({
            where,
            order: [['id', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            users: rows.map(userToJSON),
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(userToJSON(user));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// POST /api/users (admin only)
exports.createUser = async (req, res) => {
    try {
        const { username, email, password, full_name, role, emp_id, designation } = req.body;

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User with that username or email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            email,
            password_hash,
            full_name,
            role: role || 'sales',
            emp_id: emp_id || '',
            designation: designation || '',
            is_active_user: true
        });

        res.status(201).json(userToJSON(newUser));
    } catch (error) {
        res.status(400).json({ message: 'Error creating user', error: error.message });
    }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { password, ...updateData } = req.body;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password_hash = await bcrypt.hash(password, salt);
        }

        await user.update(updateData);
        res.json(userToJSON(user));
    } catch (error) {
        res.status(400).json({ message: 'Error updating user', error: error.message });
    }
};

// PATCH /api/users/:id/activate (admin only)
exports.activateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.update({
            role: req.body.role || 'sales',
            is_active_user: true
        });

        res.json(userToJSON(user));
    } catch (error) {
        res.status(400).json({ message: 'Error activating user', error: error.message });
    }
};

// PATCH /api/users/:id/deactivate (admin only)
exports.deactivateUser = async (req, res) => {
    try {
        const docRef = db.collection('users').doc(String(req.params.id));
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ message: 'User not found' });

        await docRef.update({ is_active_user: false, updated_at: new Date() });
        
        const updated = await docRef.get();
        res.json(userToJSON(updated.data()));
    } catch (error) {
        res.status(400).json({ message: 'Error deactivating user', error: error.message });
    }
};

// DELETE /api/users/:id (admin only)
exports.deleteUser = async (req, res) => {
    try {
        const docRef = db.collection('users').doc(String(req.params.id));
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ message: 'User not found' });

        await docRef.delete();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Error deleting user', error: error.message });
    }
};
