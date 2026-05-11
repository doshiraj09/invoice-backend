const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');
const { CompanySettings } = require('../models');

// QR code upload config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => cb(null, 'upi_qr' + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.route('/')
    .get(protect, getSettings)
    .put(protect, authorize('admin', 'accountant'), updateSettings);

// POST /api/settings/upload-qr
router.post('/upload-qr', protect, authorize('admin'), upload.single('qr_image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const qrPath = `/uploads/${req.file.filename}`;
        
        let settings = await CompanySettings.findOne();
        if (settings) {
            await settings.update({ upi_qr_path: qrPath });
        } else {
            await CompanySettings.create({ company_name: 'Your Company Name', upi_qr_path: qrPath });
        }
        
        res.json({ message: 'QR uploaded', upi_qr_path: qrPath });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading QR', error: error.message });
    }
});

module.exports = router;