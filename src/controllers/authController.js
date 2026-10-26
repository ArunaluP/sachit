const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

async function ensureEmailFree(email, exceptId) {
  const taken = await User.exists({ email, ...(exceptId && { _id: { $ne: exceptId } }) });
  if (taken) {
    throw new ApiError(409, 'An account with this email already exists', [
      { field: 'email', message: 'Email is already registered' },
    ]);
  }
}

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  await ensureEmailFree(email);

  // Role is never taken from the request, so nobody can register as admin
  const user = await User.create({ name, email, password, phone, address });
  res.status(201).json({ token: signToken(user), user });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email or password');
  }

  res.json({ token: signToken(user), user });
});

// GET /api/auth/me
exports.me = (req, res) => {
  res.json({ user: req.user });
};

// PUT /api/auth/me
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;
  await ensureEmailFree(email, req.user._id);

  Object.assign(req.user, { name, email, phone, address });
  await req.user.save();
  res.json({ message: 'Profile updated', user: req.user });
});

// PUT /api/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect', [
      { field: 'currentPassword', message: 'Current password is incorrect' },
    ]);
  }

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password changed successfully' });
});

exports.ensureEmailFree = ensureEmailFree;
