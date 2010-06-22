require('./core');

/**
 * Shorthand for new Ahoy(options)
 */
exports.init = function(options) {
  return new Ahoy(options);
};

exports.version = '0.0.1';
