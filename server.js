const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Initialize MySQL Database (Sequelize)
const { sequelize } = require('./config/database');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files (QR codes etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

const PORT = process.env.PORT || 5001;

// Sync database and start server
sequelize.sync({ alter: true }) // Use alter: true to safely update existing tables
    .then(() => {
        console.log('✅ MySQL Database synced successfully');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}.`);
        });
    })
    .catch((err) => {
        console.error('❌ Failed to sync database:', err.message);
    });
