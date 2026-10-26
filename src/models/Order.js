const mongoose = require('mongoose');

const ORDER_STATUSES = ['Pending', 'Processing', 'Completed', 'Cancelled'];
const PAYMENT_METHODS = ['Cash on Delivery', 'Card on Delivery'];

// Allowed status changes for the admin workflow
const STATUS_TRANSITIONS = {
  Pending: ['Processing', 'Completed', 'Cancelled'],
  Processing: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

// Name and price are copied into the order so history stays correct
// even if the medicine is later edited or deleted.
const orderItemSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' },
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: {
      type: [orderItemSchema],
      validate: { validator: (items) => items.length > 0, message: 'Order must contain at least one item' },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true,
      maxlength: 200,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\+?[0-9]{9,15}$/, 'Please enter a valid phone number'],
    },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'Cash on Delivery' },
    notes: { type: String, trim: true, maxlength: 300 },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending' },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.STATUS_TRANSITIONS = STATUS_TRANSITIONS;
