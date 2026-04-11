const User = require('../models/User');
const { createNotification } = require('../utils/notifications');

exports.getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);


    res.json({
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.adminUpdateUser = async (req, res) => {
  try {
    const { name, email, role, school, rollNo } = req.body;
    const validRoles = ['admin', 'registrar', 'dean', 'faculty', 'student'];

    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const previousRole = user.role;

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (school !== undefined) user.school = school;
    if (rollNo !== undefined) user.rollNo = rollNo;

    await user.save();

    // Role-specific notification if changed
    if (role && previousRole !== user.role) {
      await createNotification({
        recipient: user._id,
        type: 'role_change',
        title: 'Profile Updated',
        message: `Your account details have been updated by admin. New role: ${role.charAt(0).toUpperCase() + role.slice(1)}.`
      });
    }


    res.json({ message: 'User updated successfully.', user });
  } catch (error) {
    console.error('Admin user update error:', error);
    res.status(500).json({ message: 'Server error during update.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, department, school, batch, rollNo } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (req.body.avatar) {
      user.avatar = req.body.avatar;
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (department) user.department = department;
    if (school) user.school = school;
    if (batch) user.batch = batch;
    if (rollNo) user.rollNo = rollNo;

    await user.save();

    res.json({ message: 'Profile updated.', user });

  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};


exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const stats = {
      totalUsers,
      roles: {}
    };

    roleStats.forEach(r => {
      stats.roles[r._id] = r.count;
    });

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
