var HTTP = require('http');

var AhoyRequestHandler  = require('./request_handler').handler,
    AhoyInstanceMethods = require('./instance_methods');

/**
 * Base Ahoy class
 */
Ahoy = function(options) {
  var instance = this;

  this._options = options || {};

  this._handlers = {
    get: {
      exact: {},
      fuzzy: [],
    },

    post: {
      exact: {},
      fuzzy: [],
    }
  };

  this._catchAll = [];

  this._beforeFilters = [];
  this._afterFilters = [];

  this._server = HTTP.createServer(function(req, res) { AhoyRequestHandler.call(instance, req, res) });
};

Ahoy.DEFAULT_PORT = 8000;

// Extend Ahoy class with instance methods
for (var attr in AhoyInstanceMethods) Ahoy.prototype[attr] = AhoyInstanceMethods[attr];
