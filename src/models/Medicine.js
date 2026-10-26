const mongoose = require('mongoose');

const CATEGORIES = [
  'Pain Relief',
  'Antibiotics',
  'Cold & Flu',
  'Vitamins & Supplements',
  'Digestive Health',
  'Diabetes Care',
  'Heart & Blood Pressure',
  'Allergy',
  'Skin Care',
  'First Aid',
];

const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Cream', 'Injection', 'Drops', 'Inhaler', 'Other'];

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    genericName: {
      type: String,
      trim: true,
      maxlength: [100, 'Generic name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: CATEGORIES, message: '{VALUE} is not a valid category' },
    },
    dosageForm: {
      type: String,
      enum: { values: DOSAGE_FORMS, message: '{VALUE} is not a valid dosage form' },
      default: 'Tablet',
    },
    strength: {
      type: String,
      trim: true,
      maxlength: [30, 'Strength cannot exceed 30 characters'],
    },
    manufacturer: {
      type: String,
      trim: true,
      maxlength: [100, 'Manufacturer cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      validate: { validator: Number.isInteger, message: 'Stock must be a whole number' },
    },
    requiresPrescription: {
      type: Boolean,
      default: false,
    },
    expiryDate: {
      type: Date,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

medicineSchema.index({ name: 1, strength: 1 }, { unique: true });
medicineSchema.index({ category: 1 });
medicineSchema.index({ price: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.DOSAGE_FORMS = DOSAGE_FORMS;
