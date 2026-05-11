const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(150), unique: true, allowNull: false },
    email: { type: DataTypes.STRING(150), unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING(200), allowNull: false },
    full_name: { type: DataTypes.STRING(150), allowNull: false },
    role: { type: DataTypes.STRING(20), defaultValue: 'staff' },
    emp_id: { type: DataTypes.STRING(50) },
    designation: { type: DataTypes.STRING(100) },
    is_active_user: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_login: { type: DataTypes.DATE }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Instance methods
User.prototype.set_password = async function(password) {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(password, salt);
};

User.prototype.check_password = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
};

User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password_hash;
    return values;
};

module.exports = User;
