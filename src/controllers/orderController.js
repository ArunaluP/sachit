const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const { LOW_STOCK_LIMIT } = require('./medicineController');

const { STATUS_TRANSITIONS, ORDER_STATUSES } = Order;

async function restoreStock(items) {
  await Promise.all(
    items.map((item) => Medicine.updateOne({ _id: item.medicine }, { $inc: { stock: item.quantity } }))
  );
}

// POST /api/orders  (customer)
exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, phone, paymentMethod, notes } = req.body;

  // Merge duplicate lines of the same medicine
  const quantities = new Map();
  for (const { medicine, quantity } of items) {
    quantities.set(medicine, (quantities.get(medicine) || 0) + quantity);
  }

  const medicines = await Medicine.find({ _id: { $in: [...quantities.keys()] } });
  if (medicines.length !== quantities.size) {
    throw new ApiError(400, 'Some items in your cart are no longer available. Please refresh your cart.');
  }

  // Reserve stock one item at a time; the stock condition in the filter
  // stops two customers from buying the last unit at the same time.
  const reserved = [];
  for (const med of medicines) {
    const quantity = quantities.get(med._id.toString());
    const updated = await Medicine.findOneAndUpdate(
      { _id: med._id, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true }
    );
    if (!updated) {
      await restoreStock(reserved);
      throw new ApiError(400, `Only ${med.stock} unit(s) of ${med.name} left in stock`);
    }
    reserved.push({ medicine: med._id, name: med.name, price: med.price, quantity });
  }

  const totalAmount = reserved.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    const order = await Order.create({
      user: req.user._id,
      items: reserved,
      totalAmount: Math.round(totalAmount * 100) / 100,
      shippingAddress,
      phone,
      paymentMethod,
      notes,
    });
    res.status(201).json({ message: 'Order placed successfully', data: order });
  } catch (err) {
    await restoreStock(reserved);
    throw err;
  }
});

// GET /api/orders/my  (customer)
exports.getMyOrders = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (ORDER_STATUSES.includes(req.query.status)) filter.status = req.query.status;

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json({ data: orders });
});

// GET /api/orders/:id  (owner or admin)
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) throw new ApiError(404, 'Order not found');

  const isOwner = order.user && order.user._id.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new ApiError(404, 'Order not found');

  res.json({ data: order });
});

// PATCH /api/orders/:id/cancel  (customer, only while pending)
exports.cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, status: 'Pending' },
    { status: 'Cancelled' },
    { new: true }
  );

  if (!order) {
    const exists = await Order.exists({ _id: req.params.id, user: req.user._id });
    if (!exists) throw new ApiError(404, 'Order not found');
    throw new ApiError(400, 'Only pending orders can be cancelled');
  }

  await restoreStock(order.items);
  res.json({ message: 'Order cancelled', data: order });
});

// GET /api/orders  (admin)
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { status, q, sort } = req.query;
  const filter = {};
  if (ORDER_STATUSES.includes(status)) filter.status = status;

  if (q && q.trim()) {
    const pattern = new RegExp(escapeRegex(q.trim()), 'i');
    const users = await User.find({ $or: [{ name: pattern }, { email: pattern }] }).select('_id');
    filter.$or = [{ user: { $in: users.map((u) => u._id) } }, { phone: pattern }];
  }

  const sortBy = {
    oldest: { createdAt: 1 },
    total_desc: { totalAmount: -1 },
    total_asc: { totalAmount: 1 },
  }[sort] || { createdAt: -1 };

  const orders = await Order.find(filter).sort(sortBy).populate('user', 'name email phone');
  res.json({ data: orders });
});

// PATCH /api/orders/:id/status  (admin)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  if (!STATUS_TRANSITIONS[order.status].includes(status)) {
    throw new ApiError(400, `Cannot change order from ${order.status} to ${status}`);
  }

  // Conditional update so two admins cannot apply conflicting changes
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { status },
    { new: true }
  ).populate('user', 'name email phone');
  if (!updated) throw new ApiError(409, 'Order was changed by someone else. Please refresh.');

  if (status === 'Cancelled') await restoreStock(updated.items);

  res.json({ message: `Order marked as ${status}`, data: updated });
});

// GET /api/orders/stats  (admin dashboard)
exports.getStats = asyncHandler(async (req, res) => {
  const [byStatus, revenue, medicines, lowStock, customers] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { status: 'Completed' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Medicine.countDocuments(),
    Medicine.countDocuments({ stock: { $lt: LOW_STOCK_LIMIT } }),
    User.countDocuments({ role: 'customer' }),
  ]);

  const orders = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
  byStatus.forEach((row) => {
    orders[row._id] = row.count;
  });

  res.json({
    data: {
      orders,
      totalOrders: Object.values(orders).reduce((a, b) => a + b, 0),
      revenue: revenue[0] ? revenue[0].total : 0,
      medicines,
      lowStock,
      customers,
    },
  });
});
