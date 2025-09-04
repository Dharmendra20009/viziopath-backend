const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail } = require('../utils/emailService');

const signToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  domain: process.env.COOKIE_DOMAIN || undefined,
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

// Utility: pick safe user fields only
const getSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
});

// Register new user
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const user = await User.create({ name, email, password, phone });
  const verificationToken = user.generateVerificationToken();
  await user.save();

  let emailSent = true;
  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify your Viziopath account',
      template: 'verification',
      data: {
        name: user.name,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
      }
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    emailSent = false;
  }

  const token = signToken(user._id);
  res.cookie('token', token, cookieOptions());

  return res.status(201).json(
    new ApiResponse(
      201, 
      { user: getSafeUser(user) }, 
      emailSent 
        ? 'Registration successful. Please check your email to verify your account.' 
        : 'Registration successful, but we could not send a verification email. Please try again later.'
    )
  );
});

// Login user
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (user.isLocked) {
    throw new ApiError(423, 'Account is temporarily locked. Please try again later.');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    await user.incLoginAttempts();
    throw new ApiError(401, 'Invalid credentials');
  }

  await user.resetLoginAttempts();
  user.lastLogin = new Date();
  await user.save();

  const token = signToken(user._id);
  res.cookie('token', token, cookieOptions());

  return res.json(new ApiResponse(200, { user: getSafeUser(user) }, 'Login successful'));
});

// Get current user profile
exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  return res.json(new ApiResponse(200, { user: getSafeUser(user) }, 'User profile retrieved'));
});

// Update user profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, bio, location, website, social, preferences } = req.body;
  
  const updateData = {};
  if (name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (bio !== undefined) updateData['profile.bio'] = bio;
  if (location !== undefined) updateData['profile.location'] = location;
  if (website !== undefined) updateData['profile.website'] = website;
  if (social) updateData['profile.social'] = social;
  if (preferences) updateData.preferences = preferences;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return res.json(new ApiResponse(200, { user: getSafeUser(user) }, 'Profile updated successfully'));
});

// Change password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  return res.json(new ApiResponse(200, {}, 'Password changed successfully'));
});

// Forgot password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.json(new ApiResponse(200, {}, 'If an account with that email exists, a password reset link has been sent.'));
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save();

  try {
    await sendEmail({
      to: user.email,
      subject: 'Reset your Viziopath password',
      template: 'passwordReset',
      data: {
        name: user.name,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
      }
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new ApiError(500, 'Failed to send password reset email');
  }

  return res.json(new ApiResponse(200, {}, 'Password reset email sent'));
});

// Reset password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    throw new ApiError(400, 'Token and new password are required');
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return res.json(new ApiResponse(200, {}, 'Password reset successful'));
});

// Verify email
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  
  if (!token) {
    throw new ApiError(400, 'Verification token is required');
  }

  const user = await User.findOne({
    verificationToken: token,
    verificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;
  await user.save();

  return res.json(new ApiResponse(200, {}, 'Email verified successfully'));
});

// Resend verification email
exports.resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.isVerified) {
    throw new ApiError(400, 'Email is already verified');
  }

  const verificationToken = user.generateVerificationToken();
  await user.save();

  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify your Viziopath account',
      template: 'verification',
      data: {
        name: user.name,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
      }
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new ApiError(500, 'Failed to send verification email');
  }

  return res.json(new ApiResponse(200, {}, 'Verification email sent'));
});

// Logout user
exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie('token'); // simplified
  return res.json(new ApiResponse(200, {}, 'Logged out successfully'));
});

// Delete account
exports.deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    throw new ApiError(400, 'Password is required to delete account');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(400, 'Password is incorrect');
  }

  await User.findByIdAndDelete(req.user.id);
  res.clearCookie('token');

  return res.json(new ApiResponse(200, {}, 'Account deleted successfully'));
});
