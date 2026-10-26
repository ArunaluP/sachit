const User = require('../models/User');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const { ensureEmailFree } = require('./authController');

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
};

async function ensureNotLastAdmin(user) {
  if (user.role !== 'admin') return;
  const admins = await User.countDocuments({ role: 'admin' });
  if (admins <= 1) throw new ApiError(400, 'The system must have at least one admin account');
}

// GET /api/users?q=&role=&sort=
exports.getUsers = asyncHandler(async (req, res) => {
  const { q, role, sort } = req.query;
  const filter = {};
  if (User.ROLES.includes(role)) filter.role = role;
  if (q && q.trim()) {
    const pattern = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
  }

  const users = await User.find(filter).sort(SORT_OPTIONS[sort] || SORT_OPTIONS.newest).lean();

  const counts = await Order.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  const data = users.map(({ password, __v, ...u }) => ({ ...u, orderCount: countMap.get(u._id.toString()) || 0 }));
  res.json({ data });
});

// GET /api/users/:id
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ data: user });
});

// POST /api/users
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, role } = req.body;
  await ensureEmailFree(email);

  const user = await User.create({ name, email, password, phone, address, role });
  res.status(201).json({ message: 'User created successfully', data: user });
});

// PUT /api/users/:id
exports.updateUser = asyncHandler(async (req, res) => {
  const { name, email, phone, address, role, password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (user.role === 'admin' && role !== 'admin') {
    if (user._id.equals(req.user._id)) throw new ApiError(400, 'You cannot remove your own admin role');
    await ensureNotLastAdmin(user);
  }
  await ensureEmailFree(email, user._id);

  Object.assign(user, { name, email, phone, address, role });
  if (password) user.password = password;
  await user.save();

  res.json({ message: 'User updated successfully', data: user });
});

// DELETE /api/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (user._id.equals(req.user._id)) throw new ApiError(400, 'You cannot delete your own account');
  await ensureNotLastAdmin(user);

  const openOrders = await Order.countDocuments({ user: user._id, status: { $in: ['Pending', 'Processing'] } });
  if (openOrders > 0) {
    throw new ApiError(
      409,
      `Cannot delete ${user.name} because they have ${openOrders} open order(s). Complete or cancel those orders first.`
    );
  }

  await user.deleteOne();
  res.json({ message: `${user.name}'s account was deleted` });
});
