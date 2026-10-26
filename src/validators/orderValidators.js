const { body, param } = require('express-validator');
const { ORDER_STATUSES, PAYMENT_METHODS } = require('../models/Order');

const idRule = param('id').isMongoId().withMessage('Invalid order id');

const createOrderRules = [
  body('items').isArray({ min: 1, max: 50 }).withMessage('Your cart is empty'),
  body('items.*.medicine').isMongoId().withMessage('Invalid medicine in cart'),
  body('items.*.quantity').isInt({ min: 1, max: 100 }).withMessage('Quantity must be between 1 and 100').toInt(),
  body('shippingAddress')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Delivery address must be 5-200 characters'),
  body('phone').trim().matches(/^\+?[0-9]{9,15}$/).withMessage('Phone must be 9-15 digits'),
  body('paymentMethod').optional().isIn(PAYMENT_METHODS).withMessage('Invalid payment method'),
  body('notes').optional().trim().isLength({ max: 300 }).withMessage('Notes cannot exceed 300 characters'),
];

const updateStatusRules = [
  idRule,
  body('status').isIn(ORDER_STATUSES).withMessage(`Status must be one of: ${ORDER_STATUSES.join(', ')}`),
];

module.exports = { idRule, createOrderRules, updateStatusRules };
