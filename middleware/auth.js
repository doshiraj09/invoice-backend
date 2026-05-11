const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
            
            const user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password_hash'] }
            });

            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }
            
            req.user = user;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) res.status(401).json({ message: 'Not authorized, no token' });
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access Denied' });
        }
        next();
    };
};

module.exports = { protect, authorize };
