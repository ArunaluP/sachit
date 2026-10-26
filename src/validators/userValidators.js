const { body, param } = require('express-validator');
const { ROLES } = require('../models/User');

const idRule = param('id').isMongoId().withMessage('Invalid user id');

const nameRule = () => body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters');
const emailRule = () => body('email').trim().isEmail().withMessage('Please enter a valid email').normalizeEmail();
const passwordRule = (field = 'password') =>
  body(field)
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain a letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number');
const phoneRule = () =>
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^\+?[0-9]{9,15}$/)
    .withMessage('Phone must be 9-15 digits');
const addressRule = () =>
  body('address').optional().trim().isLength({ max: 200 }).withMessage('Address cannot exceed 200 characters');
const roleRule = () => body('role').isIn(ROLES).withMessage(`Role must be one of: ${ROLES.join(', ')}`);

// Logged-in user updating their own profile
const profileRules = [nameRule(), emailRule(), phoneRule(), addressRule()];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  passwordRule('newPassword'),
];

// Admin managing user accounts
const createUserRules = [nameRule(), emailRule(), passwordRule(), phoneRule(), addressRule(), roleRule()];
const updateUserRules = [
  idRule,
  nameRule(),
  emailRule(),
  phoneRule(),
  addressRule(),
  roleRule(),
  body('password').optional({ values: 'falsy' }).isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

module.exports = {
  idRule,
  nameRule,
  emailRule,
  passwordRule,
  phoneRule,
  addressRule,
  profileRules,
  changePasswordRules,
  createUserRules,
  updateUserRules,
};
