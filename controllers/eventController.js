const Event = require('../models/Event');
const User = require('../models/User');
const { createNotification, notifyMultiple } = require('../utils/notifications');

exports.createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Parse nested JSON fields if sent as strings (common with FormData/Multer)
    const nestedFields = ['eligibility', 'schedule', 'registration', 'certificate'];
    nestedFields.forEach(field => {
      if (typeof eventData[field] === 'string') {
        try {
          eventData[field] = JSON.parse(eventData[field]);
        } catch (e) {
          console.error(`Error parsing ${field}:`, e);
          // Keep as is or set to default if parsing fails
        }
      }
    });

    // Validate required fields explicitly before saving
    if (!eventData.title || !eventData.description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    if (!eventData.schedule?.startDate || !eventData.schedule?.endDate) {
      return res.status(400).json({ message: 'Start and end dates are required.' });
    }

    // Determine initial status based on schools selected
    const selectedSchools = eventData.eligibility?.schools || [];
    if (selectedSchools.length === 1) {
      eventData.status = 'pending_dean';
    } else {
      eventData.status = 'pending_registrar';
    }

    // Handle direct MongoDB storage for files (Base64)
    if (req.body.poster) {
      eventData.poster = req.body.poster;
    }
    if (req.body.certificate?.preview) {
      eventData.certificate = {
        ...(eventData.certificate || {}),
        preview: req.body.certificate.preview
      };
    }
    if (req.body.images && Array.isArray(req.body.images)) {
      eventData.images = req.body.images;
    }


    // HELPERS: Force IST (+05:30) for dates sent from India if no timezone is present
    const forceIST = (dateStr) => {
      if (!dateStr) return undefined;
      // If it's already an ISO string with Z or offset, trust it
      if (typeof dateStr === 'string' && !dateStr.includes('Z') && !dateStr.includes('+')) {
        return new Date(`${dateStr}+05:30`);
      }
      return new Date(dateStr);
    };

    if (eventData.schedule) {
      if (eventData.schedule.startDate) eventData.schedule.startDate = forceIST(eventData.schedule.startDate);
      if (eventData.schedule.endDate) eventData.schedule.endDate = forceIST(eventData.schedule.endDate);
    }
    if (eventData.registration) {
      if (eventData.registration.startDate) eventData.registration.startDate = forceIST(eventData.registration.startDate);
      if (eventData.registration.endDate) eventData.registration.endDate = forceIST(eventData.registration.endDate);
    }

    const event = new Event(eventData);
    await event.save();


    // Notify appropriate reviewers
    try {
      if (event.status === 'pending_dean' && selectedSchools.length > 0) {
        // Notify only Deans of that specific school
        const schoolDeans = await User.find({ role: 'dean', school: selectedSchools[0], isActive: true });
        if (schoolDeans.length > 0) {
          await notifyMultiple(
            schoolDeans.map(d => d._id),
            {
              type: 'approval_status',
              title: 'New Event for Your School',
              message: `Faculty ${req.user.name} has submitted "${event.title}" for your school review.`,
              relatedEvent: event._id
            }
          );
        }
      } else {
        // Notify registrars directly
        const registrars = await User.find({ role: 'registrar', isActive: true });
        if (registrars.length > 0) {
          await notifyMultiple(
            registrars.map(r => r._id),
            {
              type: 'approval_status',
              title: 'New Inter-school Event',
              message: `Faculty ${req.user.name} has submitted a multi-school event "${event.title}" for approval.`,
              relatedEvent: event._id
            }
          );
        }
      }
    } catch (notifyErr) {
      console.error('Notification error (event created but notification failed):', notifyErr);
      // We don't fail the request if notification fails after event is saved
    }

    await event.populate('createdBy', 'name email role');

    res.status(201).json({ message: 'Event created and sent for review.', event });
  } catch (error) {
    console.error('Event creation error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation Error: ' + messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error creating event. Check database connection.' });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Role-based filtering
    if (req.user.role === 'faculty') {
      query.createdBy = req.user._id;
    } else if (req.user.role === 'dean') {
      // Deans only see events related to their school, their own events, or published ones
      query.$or = [
        { 'eligibility.schools': req.user.school },
        { createdBy: req.user._id },
        { status: 'published' }
      ];
      // During approval phase, ensure they don't see drafts of others
      query.status = { $ne: 'draft' };
    } else if (req.user.role === 'registrar') {
      query.status = { $in: ['pending_registrar', 'approved', 'rejected', 'published'] };
    } else if (req.user.role === 'student') {
      query.status = 'published';
    }

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('createdBy', 'name email role')
        .populate('reviewedByDean', 'name')
        .populate('reviewedByRegistrar', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Event.countDocuments(query)
    ]);

    res.json({
      events,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email role department school')
      .populate('reviewedByDean', 'name')
      .populate('reviewedByRegistrar', 'name');

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Role-based visibility check
    const userRole = req.user.role;
    const isOwner = event.createdBy._id.toString() === req.user._id.toString();
    const isPublished = event.status === 'published';
    const isInvolvedDean = userRole === 'dean' && event.eligibility?.schools?.includes(req.user.school);

    if (userRole === 'admin' || userRole === 'registrar' || isOwner || isPublished || isInvolvedDean) {
      return res.json({ event: event.toObject() });
    }

    return res.status(403).json({ message: 'Not authorized to view this event.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Only creator or admin can update
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this event.' });
    }

    const updates = { ...req.body };

    // Parse nested JSON fields if sent as strings (common with FormData/Multer)
    const nestedFields = ['eligibility', 'schedule', 'registration', 'certificate'];
    nestedFields.forEach(field => {
      if (typeof updates[field] === 'string') {
        try {
          updates[field] = JSON.parse(updates[field]);
        } catch (e) {
          console.error(`Error parsing ${field} during update:`, e);
        }
      }
    });

    // Handle direct MongoDB storage during update
    if (req.body.poster) updates.poster = req.body.poster;
    if (req.body.images && Array.isArray(req.body.images)) updates.images = req.body.images;
    if (req.body.certificate?.preview) {
      updates.certificate = {
        ...(updates.certificate || event.certificate || {}),
        preview: req.body.certificate.preview
      };
    }

    // Protect certain fields from being updated directly
    delete updates.createdBy;
    delete updates.createdAt;
    
    // Only admin or registrar can manually change status via update
    // FORCE IST (+05:30) for update dates if no timezone is present
    const forceIST = (dateStr) => {
      if (!dateStr) return undefined;
      if (typeof dateStr === 'string' && !dateStr.includes('Z') && !dateStr.includes('+')) {
        return new Date(`${dateStr}+05:30`);
      }
      return new Date(dateStr);
    };

    if (updates.schedule) {
      if (updates.schedule.startDate) updates.schedule.startDate = forceIST(updates.schedule.startDate);
      if (updates.schedule.endDate) updates.schedule.endDate = forceIST(updates.schedule.endDate);
    }
    if (updates.registration) {
      if (updates.registration.startDate) updates.registration.startDate = forceIST(updates.registration.startDate);
      if (updates.registration.endDate) updates.registration.endDate = forceIST(updates.registration.endDate);
    }

    Object.assign(event, updates);


    await event.save();

    await event.populate('createdBy', 'name email role');

    res.json({ message: 'Event updated successfully.', event });
  } catch (error) {
    console.error('Event update error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation Error: ' + messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error updating event.' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    // Note: Cloudinary assets can be managed via the Cloudinary API if needed.
    // Local fs.unlinkSync is removed for Vercel/Serverless compatibility.
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Dean forwards to registrar
exports.forwardToRegistrar = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (event.status !== 'pending_dean') {
      return res.status(400).json({ message: 'Event is not pending dean review.' });
    }

    // Verify this is the correct school's dean
    if (event.eligibility.schools.length === 1 && event.eligibility.schools[0] !== req.user.school) {
        return res.status(403).json({ message: 'Not authorized. You can only review events for your school.' });
    }

    event.status = 'pending_registrar';
    event.reviewedByDean = req.user._id;
    event.deanReviewDate = new Date();
    await event.save();

    // Notify registrars
    const registrars = await User.find({ role: 'registrar', isActive: true });
    if (registrars.length > 0) {
      await notifyMultiple(
        registrars.map(r => r._id),
        {
          type: 'approval_status',
          title: 'Event Forwarded for Approval',
          message: `Dean has forwarded "${event.title}" for your approval.`,
          relatedEvent: event._id
        }
      );
    }

    // Notify faculty
    await createNotification({
      recipient: event.createdBy,
      type: 'approval_status',
      title: 'Event Forwarded to Registrar',
      message: `Your event "${event.title}" has been reviewed by Dean and forwarded to Registrar.`,
      relatedEvent: event._id
    });

    res.json({ message: 'Event forwarded to registrar.', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Registrar approves
exports.approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (event.status !== 'pending_registrar') {
      return res.status(400).json({ message: 'Event is not pending registrar approval.' });
    }

    event.status = 'published';
    event.reviewedByRegistrar = req.user._id;
    event.registrarReviewDate = new Date();
    // Parallelize saves and initial notifications
    await Promise.all([
      event.save(),
      createNotification({
        recipient: event.createdBy,
        type: 'approval_status',
        title: 'Event Approved!',
        message: `Your event "${event.title}" has been approved and published.`,
        relatedEvent: event._id
      })
    ]);

    // Send notifications to eligible students in the background
    const studentQuery = { role: 'student', isActive: true };
    if (event.eligibility?.batches?.length > 0) studentQuery.batch = { $in: event.eligibility.batches };
    if (event.eligibility?.departments?.length > 0) studentQuery.department = { $in: event.eligibility.departments };
    
    User.find(studentQuery).lean().then(students => {
      if (students.length > 0) {
        notifyMultiple(
          students.map(s => s._id),
          {
            type: 'registration_open',
            title: 'New Event Available',
            message: `"${event.title}" is now open for registration!`,
            relatedEvent: event._id
          }
        );
      }
    }).catch(err => console.error('Student notification error:', err));

    res.json({ message: 'Event approved and published.', event });

  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Registrar rejects
exports.rejectEvent = async (req, res) => {
  try {
    const { reason } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (!['pending_dean', 'pending_registrar'].includes(event.status)) {
      return res.status(400).json({ message: 'Event cannot be rejected in its current state.' });
    }

    // Verify school authority for Dean rejection
    if (req.user.role === 'dean' && event.status === 'pending_dean' && event.eligibility.schools.length === 1 && event.eligibility.schools[0] !== req.user.school) {
        return res.status(403).json({ message: 'Not authorized. You can only reject events for your school.' });
    }

    event.status = 'rejected';
    event.rejectionReason = reason || 'No reason provided.';
    if (req.user.role === 'registrar') {
      event.reviewedByRegistrar = req.user._id;
      event.registrarReviewDate = new Date();
    } else {
      event.reviewedByDean = req.user._id;
      event.deanReviewDate = new Date();
    }
    await event.save();

    await createNotification({
      recipient: event.createdBy,
      type: 'approval_status',
      title: 'Event Rejected',
      message: `Your event "${event.title}" has been rejected. Reason: ${event.rejectionReason}`,
      relatedEvent: event._id
    });

    res.json({ message: 'Event rejected.', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Admin override approval
exports.adminApprove = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    event.status = 'published';
    event.reviewedByRegistrar = req.user._id;
    event.registrarReviewDate = new Date();
    await event.save();

    await createNotification({
      recipient: event.createdBy,
      type: 'approval_status',
      title: 'Event Approved by Admin',
      message: `Your event "${event.title}" has been approved by admin.`,
      relatedEvent: event._id
    });

    res.json({ message: 'Event approved by admin.', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getEventStats = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'faculty') {
      query.createdBy = req.user._id;
    }

    const [total, pending, approved, rejected] = await Promise.all([
      Event.countDocuments(query),
      Event.countDocuments({ ...query, status: { $in: ['pending_dean', 'pending_registrar'] } }),
      Event.countDocuments({ ...query, status: 'published' }),
      Event.countDocuments({ ...query, status: 'rejected' })
    ]);

    res.json({ stats: { total, pending, approved, rejected } });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get eligible events for a student
exports.getEligibleEvents = async (req, res) => {
  try {
    const student = req.user;
    // FORCE IST for comparison
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));


    const Registration = require('../models/Registration');
    // Find all events this student is already registered for
    const registeredEvents = await Registration.find({ 
      student: student._id,
      status: { $in: ['registered', 'attended'] } 
    }).distinct('event');

    // Efficiently query database for eligible events
    const query = {
      _id: { $nin: registeredEvents }, // Don't show if already registered
      status: 'published',
      $and: [
        { 
          $or: [
            { 'registration.endDate': { $exists: false } },
            { 'registration.endDate': null },
            { 'registration.endDate': { $gte: nowIST } } // Don't show if ended
          ]
        },
        { 
          $or: [
            { 'eligibility.batches': { $exists: false } },
            { 'eligibility.batches': { $size: 0 } },
            { 'eligibility.batches': student.batch }
          ] 
        },
        { 
          $or: [
            { 'eligibility.departments': { $exists: false } },
            { 'eligibility.departments': { $size: 0 } },
            { 'eligibility.departments': student.department }
          ] 
        },
        { 
          $or: [
            { 'eligibility.schools': { $exists: false } },
            { 'eligibility.schools': { $size: 0 } },
            { 'eligibility.schools': student.school }
          ] 
        }
      ]
    };

    const events = await Event.find(query)
      .populate('createdBy', 'name email role department')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ events, total: events.length });

  } catch (error) {
    console.error('getEligibleEvents error:', error);
    res.status(500).json({ message: 'Server error fetching eligible events.' });
  }
};

