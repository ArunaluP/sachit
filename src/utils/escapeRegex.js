// Makes user search text safe to use inside a RegExp
module.exports = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
