const { body, param } = require('express-validator');
const { CATEGORIES, DOSAGE_FORMS } = require('../models/Medicine');

const idRule = param('id').isMongoId().withMessage('Invalid medicine id');

// On update every field is optional, but if present it must be valid
function medicineRules({ partial = false } = {}) {
  const field = (name) => (partial ? body(name).optional() : body(name));

  return [
    field('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('genericName').optional().trim().isLength({ max: 100 }).withMessage('Generic name is too long'),
    field('category').isIn(CATEGORIES).withMessage('Please choose a valid category'),
    body('dosageForm').optional().isIn(DOSAGE_FORMS).withMessage('Please choose a valid dosage form'),
    body('strength').optional().trim().isLength({ max: 30 }).withMessage('Strength is too long'),
    body('manufacturer').optional().trim().isLength({ max: 100 }).withMessage('Manufacturer is too long'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    field('price').isFloat({ min: 0, max: 1000000 }).withMessage('Price must be a positive number').toFloat(),
    field('stock').isInt({ min: 0, max: 100000 }).withMessage('Stock must be a whole number of 0 or more').toInt(),
    body('requiresPrescription').optional().isBoolean().withMessage('Prescription flag must be true or false').toBoolean(),
    body('expiryDate')
      .optional({ values: 'falsy' })
      .isISO8601()
      .withMessage('Expiry date is not valid')
      .custom((value) => new Date(value) > new Date())
      .withMessage('Expiry date must be in the future'),
    body('imageUrl')
      .optional({ values: 'falsy' })
      .trim()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Image URL must start with http:// or https://'),
  ];
}

module.exports = {
  idRule,
  createMedicineRules: medicineRules(),
  updateMedicineRules: [idRule, ...medicineRules({ partial: true })],
};
