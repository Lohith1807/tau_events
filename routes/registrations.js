const router = require('express').Router();
const registrationController = require('../controllers/registrationController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, authorize('student'), registrationController.registerForEvent);
router.get('/my', auth, registrationController.getMyRegistrations);
router.get('/event/:eventId', auth, registrationController.getEventRegistrations);
router.get('/:id', auth, registrationController.getRegistrationById);
router.get('/:id/id-card', auth, registrationController.getIdCard);
router.put('/:id/cancel', auth, registrationController.cancelRegistration);
router.post('/attendance', auth, authorize('faculty', 'admin'), registrationController.markAttendance);

module.exports = router;
