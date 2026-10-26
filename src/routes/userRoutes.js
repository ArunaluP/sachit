const router = require('express').Router();
const users = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idRule, createUserRules, updateUserRules } = require('../validators/userValidators');

router.use(protect, authorize('admin'));

router.get('/', users.getUsers);
router.get('/:id', idRule, validate, users.getUser);
router.post('/', createUserRules, validate, users.createUser);
router.put('/:id', updateUserRules, validate, users.updateUser);
router.delete('/:id', idRule, validate, users.deleteUser);

module.exports = router;
