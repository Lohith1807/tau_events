const router = require('express').Router();
const eventController = require('../controllers/eventController');
const { auth, authorize } = require('../middleware/auth');
router.post('/', auth, authorize('faculty', 'admin'), eventController.createEvent);
router.get('/', auth, eventController.getAllEvents);
router.get('/stats', auth, eventController.getEventStats);
router.get('/eligible', auth, authorize('student'), eventController.getEligibleEvents);
router.get('/:id', auth, eventController.getEventById);
router.put('/:id', auth, authorize('faculty', 'admin'), eventController.updateEvent);
router.delete('/:id', auth, authorize('faculty', 'admin'), eventController.deleteEvent);

// Approval workflow
router.put('/:id/forward', auth, authorize('dean'), eventController.forwardToRegistrar);
router.put('/:id/approve', auth, authorize('registrar'), eventController.approveEvent);
router.put('/:id/reject', auth, authorize('dean', 'registrar'), eventController.rejectEvent);
router.put('/:id/admin-approve', auth, authorize('admin'), eventController.adminApprove);

module.exports = router;
