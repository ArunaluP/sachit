const Medicine = require('../models/Medicine');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');

const { CATEGORIES, DOSAGE_FORMS } = Medicine;

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  stock_asc: { stock: 1 },
  stock_desc: { stock: -1 },
};

const LOW_STOCK_LIMIT = 10;

// GET /api/medicines?q=&category=&inStock=&lowStock=&minPrice=&maxPrice=&sort=&page=&limit=
exports.getMedicines = asyncHandler(async (req, res) => {
  const { q, category, inStock, lowStock, minPrice, maxPrice, sort } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 100);

  const filter = {};
  if (q && q.trim()) {
    const pattern = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ name: pattern }, { genericName: pattern }, { manufacturer: pattern }];
  }
  if (category && CATEGORIES.includes(category)) filter.category = category;
  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (lowStock === 'true') filter.stock = { $lt: LOW_STOCK_LIMIT };

  const min = parseFloat(minPrice);
  const max = parseFloat(maxPrice);
  if (!Number.isNaN(min) || !Number.isNaN(max)) {
    filter.price = {};
    if (!Number.isNaN(min)) filter.price.$gte = min;
    if (!Number.isNaN(max)) filter.price.$lte = max;
  }

  const [data, total] = await Promise.all([
    Medicine.find(filter)
      .sort(SORT_OPTIONS[sort] || SORT_OPTIONS.newest)
      .skip((page - 1) * limit)
      .limit(limit),
    Medicine.countDocuments(filter),
  ]);

  res.json({ data, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
});

// GET /api/medicines/meta
exports.getMeta = (req, res) => {
  res.json({ categories: CATEGORIES, dosageForms: DOSAGE_FORMS, sortOptions: Object.keys(SORT_OPTIONS) });
};

// GET /api/medicines/:id
exports.getMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) throw new ApiError(404, 'Medicine not found');
  res.json({ data: medicine });
});

// POST /api/medicines  (admin)
exports.createMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.create(req.body);
  res.status(201).json({ message: 'Medicine added successfully', data: medicine });
});

// PUT /api/medicines/:id  (admin)
exports.updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!medicine) throw new ApiError(404, 'Medicine not found');
  res.json({ message: 'Medicine updated successfully', data: medicine });
});

// DELETE /api/medicines/:id  (admin)
exports.deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) throw new ApiError(404, 'Medicine not found');

  // Do not remove a medicine that still has to be delivered in an open order
  const openOrders = await Order.countDocuments({
    'items.medicine': medicine._id,
    status: { $in: ['Pending', 'Processing'] },
  });
  if (openOrders > 0) {
    throw new ApiError(
      409,
      `Cannot delete "${medicine.name}" because it is part of ${openOrders} open order(s). Complete or cancel those orders first, or set stock to 0.`
    );
  }

  await medicine.deleteOne();
  res.json({ message: `"${medicine.name}" was deleted` });
});

exports.LOW_STOCK_LIMIT = LOW_STOCK_LIMIT;
