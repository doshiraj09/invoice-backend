const { CompanySettings } = require('../models');

exports.getSettings = async (req, res) => {
    try {
        let settings = await CompanySettings.findOne();
        if (!settings) {
            settings = await CompanySettings.create({ company_name: 'Your Company Name' });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        let settings = await CompanySettings.findOne();
        
        if (settings) {
            await settings.update(req.body);
        } else {
            settings = await CompanySettings.create(req.body);
        }
        
        res.json(settings);
    } catch (error) {
        res.status(400).json({ message: 'Error updating settings', error: error.message });
    }
};
