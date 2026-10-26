// Fills the database with an admin, a demo customer and sample medicines.
// Run with: npm run seed   (WARNING: clears existing users, medicines and orders)
// The two accounts can be changed with the SEED_* variables in .env
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Order = require('../models/Order');

const accounts = [
  {
    name: process.env.SEED_ADMIN_NAME || 'Pharmacy Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@pharmacy.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
    phone: '0771234567',
  },
  {
    name: process.env.SEED_CUSTOMER_NAME || 'Demo Customer',
    email: process.env.SEED_CUSTOMER_EMAIL || 'customer@pharmacy.com',
    password: process.env.SEED_CUSTOMER_PASSWORD || 'Customer@123',
    role: 'customer',
    phone: '0719876543',
    address: '12 Galle Road, Colombo 03',
  },
];

const monthsFromNow = (months) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
};

const medicines = [
  { name: 'Paracetamol', genericName: 'Acetaminophen', category: 'Pain Relief', dosageForm: 'Tablet', strength: '500mg', manufacturer: 'State Pharmaceuticals', price: 45, stock: 250, description: 'Relieves mild to moderate pain and reduces fever. Pack of 10 tablets.', expiryDate: monthsFromNow(24) },
  { name: 'Ibuprofen', genericName: 'Ibuprofen', category: 'Pain Relief', dosageForm: 'Tablet', strength: '400mg', manufacturer: 'Hemas Pharmaceuticals', price: 120, stock: 140, description: 'Anti-inflammatory pain reliever for headaches, muscle pain and fever. Pack of 10.', expiryDate: monthsFromNow(18) },
  { name: 'Amoxicillin', genericName: 'Amoxicillin', category: 'Antibiotics', dosageForm: 'Capsule', strength: '250mg', manufacturer: 'GSK', price: 280, stock: 60, requiresPrescription: true, description: 'Broad-spectrum antibiotic for bacterial infections. Prescription required. Pack of 10.', expiryDate: monthsFromNow(12) },
  { name: 'Azithromycin', genericName: 'Azithromycin', category: 'Antibiotics', dosageForm: 'Tablet', strength: '500mg', manufacturer: 'Pfizer', price: 650, stock: 8, requiresPrescription: true, description: 'Macrolide antibiotic used for respiratory and skin infections. Pack of 3.', expiryDate: monthsFromNow(14) },
  { name: 'Cetirizine', genericName: 'Cetirizine Hydrochloride', category: 'Allergy', dosageForm: 'Tablet', strength: '10mg', manufacturer: 'Cipla', price: 90, stock: 180, description: 'Antihistamine for hay fever, runny nose and itchy eyes. Pack of 10.', expiryDate: monthsFromNow(20) },
  { name: 'Vitamin C', genericName: 'Ascorbic Acid', category: 'Vitamins & Supplements', dosageForm: 'Tablet', strength: '1000mg', manufacturer: 'Nature\'s Bounty', price: 950, stock: 75, description: 'Supports the immune system. Bottle of 30 effervescent tablets.', expiryDate: monthsFromNow(22) },
  { name: 'Multivitamin', genericName: 'Multivitamin & Minerals', category: 'Vitamins & Supplements', dosageForm: 'Capsule', strength: '', manufacturer: 'Centrum', price: 1850, stock: 40, description: 'Daily multivitamin with essential minerals. Bottle of 30.', expiryDate: monthsFromNow(20) },
  { name: 'Cough Syrup', genericName: 'Dextromethorphan', category: 'Cold & Flu', dosageForm: 'Syrup', strength: '100ml', manufacturer: 'Link Natural', price: 420, stock: 5, description: 'Relieves dry cough and throat irritation.', expiryDate: monthsFromNow(10) },
  { name: 'Omeprazole', genericName: 'Omeprazole', category: 'Digestive Health', dosageForm: 'Capsule', strength: '20mg', manufacturer: 'AstraZeneca', price: 210, stock: 95, description: 'Reduces stomach acid. Used for heartburn and gastritis. Pack of 14.', expiryDate: monthsFromNow(16) },
  { name: 'Metformin', genericName: 'Metformin Hydrochloride', category: 'Diabetes Care', dosageForm: 'Tablet', strength: '500mg', manufacturer: 'Sun Pharma', price: 160, stock: 120, requiresPrescription: true, description: 'First-line medicine for type 2 diabetes. Pack of 20.', expiryDate: monthsFromNow(24) },
  { name: 'Amlodipine', genericName: 'Amlodipine Besylate', category: 'Heart & Blood Pressure', dosageForm: 'Tablet', strength: '5mg', manufacturer: 'Pfizer', price: 190, stock: 0, requiresPrescription: true, description: 'Calcium channel blocker for high blood pressure. Pack of 14.', expiryDate: monthsFromNow(18) },
  { name: 'Hydrocortisone Cream', genericName: 'Hydrocortisone', category: 'Skin Care', dosageForm: 'Cream', strength: '1%', manufacturer: 'Glenmark', price: 340, stock: 55, description: 'Relieves itching, rashes and skin inflammation. 15g tube.', expiryDate: monthsFromNow(15) },
  { name: 'Antiseptic Liquid', genericName: 'Chloroxylenol', category: 'First Aid', dosageForm: 'Other', strength: '250ml', manufacturer: 'Dettol', price: 560, stock: 70, description: 'Antiseptic disinfectant for cuts, grazes and personal hygiene.', expiryDate: monthsFromNow(30) },
  { name: 'Oral Rehydration Salts', genericName: 'ORS', category: 'Digestive Health', dosageForm: 'Other', strength: '', manufacturer: 'Jeevanee', price: 35, stock: 300, description: 'Replaces fluids and salts lost from diarrhoea or dehydration. 1 sachet.', expiryDate: monthsFromNow(24) },
];

async function seed() {
  await connectDB();

  await Promise.all([User.deleteMany({}), Medicine.deleteMany({}), Order.deleteMany({})]);

  // create() runs one save per user so each password is hashed
  await User.create(accounts);
  await Medicine.create(medicines);

  console.log(`Seeded ${accounts.length} users and ${medicines.length} medicines.`);
  accounts.forEach((a) => console.log(`${a.role.padEnd(8)} login: ${a.email} / ${a.password}`));
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
