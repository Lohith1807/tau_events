const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');

exports.registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const student = req.user;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (event.status !== 'published') {
      return res.status(400).json({ message: 'Event is not open for registration.' });
    }

    // FORCE IST COMPARISON: Get current time specifically in India timezone
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    // Treat the saved date as IST as well
    const startTime = event.registration.startDate ? new Date(event.registration.startDate) : null;
    const endTime = event.registration.endDate ? new Date(event.registration.endDate) : null;

    if (startTime) {
      // Convert startTime to an IST comparison object
      const startIST = new Date(startTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      
      if (nowIST < startIST) {
        return res.status(400).json({ 
          message: `Registration hasn't started yet. It starts at ${startTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST).` 
        });
      }
    }

    if (endTime) {
      const endIST = new Date(endTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      if (nowIST > endIST) {
        return res.status(400).json({ message: 'Registration period has ended.' });
      }
    }



    // Check seat availability
    if (event.registration.type === 'limited') {
      if (event.registration.registeredCount >= event.registration.maxSeats) {
        return res.status(400).json({ message: 'No seats available. Event is full.' });
      }
    }

    // Check eligibility
    const elig = event.eligibility;
    if (elig) {
      if (elig.batches?.length > 0 && !elig.batches.includes(student.batch)) {
        return res.status(400).json({ message: 'You are not eligible for this event (batch mismatch).' });
      }
      if (elig.departments?.length > 0 && !elig.departments.includes(student.department)) {
        return res.status(400).json({ message: 'You are not eligible for this event (department mismatch).' });
      }
      if (elig.schools?.length > 0 && !elig.schools.includes(student.school)) {
        return res.status(400).json({ message: 'You are not eligible for this event (school mismatch).' });
      }
    }

    // Check duplicate or previously cancelled registration
    const existing = await Registration.findOne({ event: eventId, student: student._id });
    if (existing) {
      if (existing.status === 'registered' || existing.status === 'attended') {
        return res.status(400).json({ message: 'You are already registered for this event.' });
      }
      
      // If it was cancelled, let them re-register
      if (existing.status === 'cancelled') {
        // Re-check seat availability before re-registering
        if (event.registration.type === 'limited') {
          if (event.registration.registeredCount >= event.registration.maxSeats) {
            return res.status(400).json({ message: 'No seats available. Event is full.' });
          }
        }

        existing.status = 'registered';
        await existing.save();

        // Update seat count
        event.registration.registeredCount = (event.registration.registeredCount || 0) + 1;
        await event.save();

        return res.status(200).json({
          message: 'Registration reactivated successfully!',
          registration: existing
        });
      }
    }

    // Generate registration ID manually to include in QR data
    const registrationId = Math.random().toString(36).substr(2, 8).toUpperCase();

    // Create comprehensive QR data string for ID card
    const qrDataString = [
      `Registration ID: ${registrationId}`,
      `Student: ${student.name}`,
      `Roll No: ${student.rollNo}`,
      `Dept: ${student.department || 'N/A'}`,
      `School: ${student.school || 'N/A'}`,
      `Batch: ${student.batch || 'N/A'}`,
      `Event: ${event.title}`
    ].join('\n');

    const registration = new Registration({
      event: eventId,
      student: student._id,
      registrationId,
      qrData: qrDataString,
      idCardGenerated: true
    });

    // Check seat availability again and increment atomically
    if (event.registration.type === 'limited') {
      const updatedEvent = await Event.findOneAndUpdate(
        { 
          _id: eventId, 
          'registration.registeredCount': { $lt: event.registration.maxSeats } 
        },
        { $inc: { 'registration.registeredCount': 1 } },
        { new: true }
      );

      if (!updatedEvent) {
        return res.status(400).json({ message: 'No seats available. Event is full.' });
      }
    } else {
      // For unlimited events, just increment
      await Event.findByIdAndUpdate(eventId, { $inc: { 'registration.registeredCount': 1 } });
    }

    // Save registration
    await registration.save();

    // Background notification (don't block the response)
    createNotification({
      recipient: student._id,
      type: 'general',
      title: 'Registration Successful',
      message: `You have been registered for "${event.title}". Your registration ID is ${registration.registrationId}.`,
      relatedEvent: event._id
    }).catch(err => console.error('Notification error:', err));

    // Parallelize population
    await Promise.all([
      registration.populate('event', 'title schedule venue'),
      registration.populate('student', 'name email rollNo')
    ]);


    res.status(201).json({
      message: 'Registration successful!',
      registration
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You are already registered for this event.' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

exports.getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.user._id })
      .populate({
        path: 'event',
        populate: { path: 'createdBy', select: 'name email' }
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ registrations });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getEventRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.eventId })
      .populate('student', 'name email rollNo department batch phone')
      .sort({ createdAt: -1 });

    res.json({ registrations });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate({
        path: 'event',
        populate: { path: 'createdBy', select: 'name email' }
      })
      .populate('student', 'name email rollNo department batch');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    res.json({ registration });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    if (registration.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration is already cancelled.' });
    }

    const oldStatus = registration.status;
    registration.status = 'cancelled';
    await registration.save();

    // Recover seat count atomically if they were actually registered
    if (oldStatus === 'registered' || oldStatus === 'attended') {
      await Event.findByIdAndUpdate(registration.event, { 
        $inc: { 'registration.registeredCount': -1 } 
      });
    }

    res.json({ message: 'Registration cancelled.', registration });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { registrationId } = req.body;

    const registration = await Registration.findOne({ registrationId })
      .populate('student', 'name rollNo')
      .populate('event', 'title');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration is already cancelled.' });
    }

    registration.status = 'attended';
    await registration.save();

    res.json({ message: 'Attendance marked.', registration });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};


exports.getIdCard = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('event', 'title schedule venue category')
      .populate('student', 'name email rollNo department batch school');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    res.json({
      idCard: {
        studentName: registration.student.name,
        rollNo: registration.student.rollNo,
        department: registration.student.department,
        eventTitle: registration.event.title,
        eventDate: registration.event.schedule?.startDate,
        venue: registration.event.schedule?.venue,
        registrationId: registration.registrationId,
        qrData: registration.qrData
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
