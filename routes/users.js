const router = require('express').Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, authorize('admin'), userController.getAllUsers);
router.get('/stats', auth, authorize('admin'), userController.getDashboardStats);
router.get('/profile', auth, userController.updateProfile);
router.put('/profile', auth, userController.updateProfile);

router.get('/:id', auth, userController.getUserById);
router.put('/:id/admin-update', auth, authorize('admin'), userController.adminUpdateUser);
router.put('/:id/toggle-status', auth, authorize('admin'), userController.toggleUserStatus);
router.delete('/:id', auth, authorize('admin'), userController.deleteUser);

module.exports = router;
