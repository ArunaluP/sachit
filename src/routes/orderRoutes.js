const router = require('express').Router();
const orders = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idRule, createOrderRules, updateStatusRules } = require('../validators/orderValidators');

router.use(protect);

// Customer
router.post('/', authorize('customer'), createOrderRules, validate, orders.createOrder);
router.get('/my', orders.getMyOrders);
router.patch('/:id/cancel', authorize('customer'), idRule, validate, orders.cancelMyOrder);

// Admin
router.get('/stats', authorize('admin'), orders.getStats);
router.get('/', authorize('admin'), orders.getAllOrders);
router.patch('/:id/status', authorize('admin'), updateStatusRules, validate, orders.updateOrderStatus);

// Owner or admin (checked in controller)
router.get('/:id', idRule, validate, orders.getOrder);

module.exports = router;
