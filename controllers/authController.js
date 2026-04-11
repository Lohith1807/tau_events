const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');
const { sendOTP: mailOTP } = require('../utils/mailer');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, rollNo, department, school, programLevel, batch, phone, avatar } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const user = new User({
      name,
      email,
      password,
      rollNo: rollNo || '',
      department: department || '',
      school: school || '',
      programLevel: programLevel || '',
      batch: batch || '',
      phone: phone || '',
      avatar: avatar || '',
      role: 'student', // Default role
      otp,
      otpExpires,
      isVerified: false
    });

    // Parallelize DB save and Mail send for speed
    await Promise.all([
      user.save(),
      mailOTP(email, otp, 'Registration')
    ]);
    console.log(`OTP sent to ${email}`);

    res.status(201).json({
      message: 'Account created. Please verify your email with the OTP sent.',
      userId: user._id,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified.' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Email verified successfully.',
      token,
      user
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during verification.' });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified.' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    await mailOTP(email, otp, 'Verification');
    console.log(`Resend OTP to ${email}`);

    res.json({
      message: 'New OTP sent to your email.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Trim and sanitize inputs
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPassword = password ? password.trim() : '';

    const user = await User.findOne({ email: cleanEmail });
    
    if (!user) {
      console.log(`Login failure: User not found for ${cleanEmail}`);
      return res.status(400).json({ message: 'Authentication failed. Please check your email.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated.' });
    }

    const isMatch = await user.comparePassword(cleanPassword);
    
    if (!isMatch) {
      console.log(`Login failure: Password mismatch for ${cleanEmail}`);
      return res.status(400).json({ message: 'Authentication failed. Please check your password.' });
    }

    // Mandatory Login OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    try {
      // Parallelize DB update and Mail send
      await Promise.all([
        user.save(),
        mailOTP(email, otp, 'Login Security')
      ]);
      
      res.json({
        message: 'Login credentials verified. Please enter the OTP sent to your email.',
        requiresVerification: true,
        email: user.email
      });
    } catch (mailErr) {
      console.error('Login Mailing Error:', mailErr);
      // Even if mail fails, we saved the OTP, but we must notify the user
      res.status(500).json({ 
        message: 'Could not send OTP to your email. Please check your internet or try again later.',
        error: mailErr.message 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};



exports.verifyLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.otp || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Clear OTP and finalize login
    user.otp = null;
    user.otpExpires = null;
    user.isVerified = true; // Ensure they are marked verified if they logged in via OTP
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful.',
      token,
      user
    });
  } catch (error) {
    console.error('Login OTP verification error:', error);
    res.status(500).json({ message: 'Server error during verification.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email.' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    // Parallelize DB update and Mail send for speed
    await Promise.all([
      user.save(),
      mailOTP(email, otp, 'Password Recovery')
    ]);
    console.log(`Reset OTP for ${email}`);

    res.json({
      message: 'Password reset OTP sent to your email.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.otp || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.password = newPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
