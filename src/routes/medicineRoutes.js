const router = require('express').Router();
const medicines = require('../controllers/medicineController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idRule, createMedicineRules, updateMedicineRules } = require('../validators/medicineValidators');

const adminOnly = [protect, authorize('admin')];

router.get('/', medicines.getMedicines);
router.get('/meta', medicines.getMeta);
router.get('/:id', idRule, validate, medicines.getMedicine);

router.post('/', adminOnly, createMedicineRules, validate, medicines.createMedicine);
router.put('/:id', adminOnly, updateMedicineRules, validate, medicines.updateMedicine);
router.delete('/:id', adminOnly, idRule, validate, medicines.deleteMedicine);

module.exports = router;
