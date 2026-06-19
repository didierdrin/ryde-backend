const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Passenger = require('../models/Passenger');
const Driver = require('../models/Driver');
const { getCurrentReferralCode, isValidReferralCode } = require('../utils/adminReferralCode');

const formatUser = (user) => ({
  userId: user.user_id,
  name: user.name,
  email: user.email,
  phoneNumber: user.phone_number,
  userType: user.user_type,
  registrationDate: user.registration_date,
  isActive: user.is_active,
  lastLogin: user.last_login,
  createdAt: user.created_at,
});

const generateToken = (userId, email, userType) => {
  return jwt.sign(
    { userId, email, userType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, userType, referralCode } = req.body;

    // Validate required fields
    if (!name || !email || !phoneNumber || !password || !userType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (userType === 'ADMIN') {
      if (!referralCode || !referralCode.trim()) {
        return res.status(400).json({ error: 'Referral code is required for admin registration' });
      }
      if (!isValidReferralCode(referralCode)) {
        return res.status(403).json({ error: 'Invalid or expired referral code' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email) || await User.findByPhone(phoneNumber);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phoneNumber,
      password,
      userType
    });

    // Create profile based on user type
    if (userType === 'PASSENGER') {
      await Passenger.create(user.user_id);
    } else if (userType === 'DRIVER') {
      await Driver.create(user.user_id, { licenseNumber: req.body.licenseNumber || '' });
    }

    // Generate token
    const token = generateToken(user.user_id, user.email, user.user_type);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phone_number,
        userType: user.user_type
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await User.updateLastLogin(user.user_id);

    // Generate token
    const token = generateToken(user.user_id, user.email, user.user_type);

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phone_number,
        userType: user.user_type
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: formatUser(user) });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
};

exports.getAdminReferralCode = async (req, res) => {
  try {
    const referral = getCurrentReferralCode();
    res.json(referral);
  } catch (error) {
    console.error('Get admin referral code error:', error);
    res.status(500).json({ error: 'Failed to generate referral code', details: error.message });
  }
};
