const router = require('express').Router();
const auth = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerRules, loginRules } = require('../validators/authValidators');
const { profileRules, changePasswordRules } = require('../validators/userValidators');

router.post('/register', registerRules, validate, auth.register);
router.post('/login', loginRules, validate, auth.login);
router.get('/me', protect, auth.me);
router.put('/me', protect, profileRules, validate, auth.updateProfile);
router.put('/password', protect, changePasswordRules, validate, auth.changePassword);

module.exports = router;
