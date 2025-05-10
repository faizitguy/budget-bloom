const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Register User
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).send({ error: 'Email already in use' });
    }
    const user = new User({ email, password, firstName, lastName });
    await user.save();
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in the environment variables');
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).send({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).send({ error: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).send({ error: 'Invalid login credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
};

// Logout User
exports.logout = async (req, res) => {
  try {
    res.send({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    res.send(req.user);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['firstName', 'lastName', 'preferences'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!(await req.user.comparePassword(currentPassword))) {
      return res.status(400).send({ error: 'Current password is incorrect' });
    }
    req.user.password = newPassword;
    await req.user.save();
    res.send({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).send(error);
  }
};

// Request Password Reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      // In a real application, send a reset email here
      // For MVP, just return a success message
    }
    res.send({ message: 'If your email is registered, you will receive a password reset link.' });
  } catch (error) {
    res.status(400).send(error);
  }
}; 