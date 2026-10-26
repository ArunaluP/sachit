const { validationResult } = require('express-validator');

// Runs after express-validator chains and returns field errors in one format
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array({ onlyFirstError: true }).map((e) => ({ field: e.path, message: e.msg }));
  res.status(400).json({ message: 'Validation failed', errors });
};
