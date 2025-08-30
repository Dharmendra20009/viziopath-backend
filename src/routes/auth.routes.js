const router = require('express').Router();
const { 
  register, 
  login, 
  me, 
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  logout, 
  deleteAccount 
} = require('../controllers/auth.controller');
const auth = require('../middlewares/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// Protected routes
router.get('/me', auth, me);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);
router.post('/logout', auth, logout);
router.delete('/account', auth, deleteAccount);

module.exports = router;