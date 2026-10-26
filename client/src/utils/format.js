export function money(value) {
  return `Rs. ${Number(value).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value, withTime = false) {
  if (!value) return '-';
  const opts = { year: 'numeric', month: 'short', day: 'numeric' };
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' });
  return new Date(value).toLocaleString('en-GB', opts);
}

export function shortId(id) {
  return `#${String(id).slice(-6).toUpperCase()}`;
}

export const CATEGORY_ICONS = {
  'Pain Relief': '💊',
  Antibiotics: '🧪',
  'Cold & Flu': '🤧',
  'Vitamins & Supplements': '🍊',
  'Digestive Health': '🫃',
  'Diabetes Care': '🩸',
  'Heart & Blood Pressure': '❤️',
  Allergy: '🌼',
  'Skin Care': '🧴',
  'First Aid': '🩹',
};
