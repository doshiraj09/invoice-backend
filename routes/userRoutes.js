const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// GET all users (admin only)
router.get('/', protect, authorize('admin'), userController.getUsers);

// GET user by ID (admin or self)
router.get('/:id', protect, userController.getUserById);

// CREATE user (admin only)
router.post('/', protect, authorize('admin'), userController.createUser);

// UPDATE user (admin or self)
router.put('/:id', protect, userController.updateUser);

// ACTIVATE user (admin only)
router.patch('/:id/activate', protect, authorize('admin'), userController.activateUser);

// DEACTIVATE user (admin only)
router.patch('/:id/deactivate', protect, authorize('admin'), userController.deactivateUser);

// DELETE user (admin only)
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

module.exports = router;
