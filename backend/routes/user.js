const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user');

router.post('/complete', auth, async (req, res) => {
  const { name, phone, address, city, state } = req.body;
  const user = req.user;
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = address;
  if (city) user.city = city;
  if (state) user.state = state;
  user.profileComplete = true;
  await user.save();
  res.json({ success: true, user });
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('Fetching profile for user ID:', req.user._id);
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('User profile data:', {
      name: user.name,
      email: user.email,
      city: user.city,
      state: user.state,
      phone: user.phone
    });
    res.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, city, state, phone } = req.body;
    console.log('Updating profile for user ID:', req.user._id);
    console.log('Update data:', { name, email, city, state, phone });
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (city) user.city = city;
    if (state) user.state = state;
    if (phone) user.phone = phone;

    await user.save();

    const updatedUser = await User.findById(req.user._id).select('-password');
    console.log('Updated user data:', updatedUser);
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has a password (Google OAuth users might not have one)
    if (!user.password) {
      return res.status(400).json({ error: 'No password set. Please use Google sign-in or contact support.' });
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    user.password = hashedNewPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
