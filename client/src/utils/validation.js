// Client-side checks that mirror the server rules, so users get instant feedback

export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
export const PHONE_PATTERN = /^\+?[0-9]{9,15}$/;

export function passwordProblem(password) {
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (!/[A-Za-z]/.test(password)) return 'Password must contain a letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  return null;
}

export function validateUser(values, { requirePassword = false, checkConfirm = false } = {}) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter a valid email';
  if (requirePassword || values.password) {
    const problem = passwordProblem(values.password || '');
    if (problem) errors.password = problem;
  }
  if (checkConfirm && values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match';
  if (values.phone && !PHONE_PATTERN.test(values.phone.trim())) errors.phone = 'Phone must be 9-15 digits';
  if (values.address && values.address.length > 200) errors.address = 'Address cannot exceed 200 characters';
  return errors;
}

export function validateMedicine(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Name is required';
  if (!values.category) errors.category = 'Please choose a category';
  if (values.price === '' || Number(values.price) < 0) errors.price = 'Price must be 0 or more';
  if (values.stock === '' || !Number.isInteger(Number(values.stock)) || Number(values.stock) < 0) {
    errors.stock = 'Stock must be a whole number of 0 or more';
  }
  if (values.expiryDate && new Date(values.expiryDate) <= new Date()) errors.expiryDate = 'Expiry date must be in the future';
  if (values.imageUrl && !/^https?:\/\/.+/i.test(values.imageUrl)) {
    errors.imageUrl = 'Image URL must start with http:// or https://';
  }
  return errors;
}

export function validateCheckout(values) {
  const errors = {};
  if (values.shippingAddress.trim().length < 5) errors.shippingAddress = 'Please enter your full delivery address';
  if (!PHONE_PATTERN.test(values.phone.trim())) errors.phone = 'Phone must be 9-15 digits';
  return errors;
}
