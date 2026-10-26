const { body } = require('express-validator');
const { nameRule, emailRule, passwordRule, phoneRule, addressRule } = require('./userValidators');

const registerRules = [nameRule(), emailRule(), passwordRule(), phoneRule(), addressRule()];

const loginRules = [
  body('email').trim().isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { registerRules, loginRules };
