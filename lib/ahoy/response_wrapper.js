var System       = require('sys'),
    EventEmitter = require('events').EventEmitter,
    Buffer       = require('buffer').Buffer;

/**
 * Wrapper class for node's regular HTTP response
 *
 * Buffers headers and body so they can be mangled
 * before pushing back to the client
 *
 * Body can be set to a string, a buffer, or any
 * other object as long as it responds to forEach
 *
 * Also behaves as an EventEmitter, allowing callbacks to
 * fire right before sending data to the client (thus
 * allowing for last-minute modifications to headers
 * and body).
 */
var AhoyResponseWrapper = function(res) {
  this._raw = res;
  this._headers = {};
  this._status = 200;
  this._encoding = 'ascii';
  this._body = [];
};

// Inherit from EventEmitter
System.inherits(AhoyResponseWrapper, EventEmitter);

/**
 * Get or set response headers.
 *
 * Get forms:
 *   response.header()
 *   response.header('Header')
 *
 * NOTE: When called with no arguments it returns the entire raw
 * headers hash (by reference, not copy). Modifying it is permitted,
 * but be careful.
 *
 * Set forms:
 *   response.header('Header', 'Value')
 *   response.header({'First-Header': 'Value', 'Second-Header': 'Value'})
 *
 * Both set forms return `this'.
 *
 * If the headers were already set they get overwritten.
 */
AhoyResponseWrapper.prototype.header = function() {
  if (arguments.length == 0) {
    return this._headers;
  } else if (arguments.length == 1) {
    if (typeof arguments[0] === 'string') {
      return this._headers[arguments[0]];
    } else {
      for (var header in arguments[0]) this._headers[header] = arguments[0][header];
    }
  } else {
    this._headers[arguments[0]] = arguments[1];
  }

  return this;
};

// Alias for headers
AhoyResponseWrapper.prototype.headers = AhoyResponseWrapper.prototype.header;

/**
 * Removes a header.
 */
AhoyResponseWrapper.prototype.removeHeader = function(header) {
  delete this._headers[header];
  return this;
};

/**
 * Removes all headers.
 */
AhoyResponseWrapper.prototype.clearHeaders = function() {
  this._headers = {};
  return this;
};

/**
 * Get or set Content-Type header.
 *
 * Get form:
 *   response.contentType()
 *
 * Set form:
 *   response.contentType('application/octet-stream')
 *
 * Set form return `this'.
 *
 * If the headers were already set they get overwritten.
 */
AhoyResponseWrapper.prototype.contentType = function() {
  if (arguments.length == 0) {
    return this.headers('Content-Type');
  }

  return this.headers('Content-Type', arguments[0]);
}

/**
 * Get or set response status.
 *
 * Get form:
 *   response.status()
 *
 * Set forms:
 *   response.status(500);
 *
 * The set form returns `this'.
 *
 */
AhoyResponseWrapper.prototype.status = function() {
  if (arguments.length == 0) {
    return this._status;
  }

  this._status = arguments[0];
  return this;
};

/**
 * Get or set response body.
 *
 * Get form:
 *   response.body()
 *
 * Set forms:
 *   response.body('Hello world');
 *
 * The set form returns `this'.
 *
 */
AhoyResponseWrapper.prototype.body = function() {
  if (arguments.length == 0) {
    return this._body;
  }

  this._body = arguments[0];
  return this;
};

/**
 * Appends elements to the body array.
 *
 * If body isn't an array it will make it one, with the
 * old body as the first element.
 *
 * Returns `this'.
 */
AhoyResponseWrapper.prototype.appendBody = function() {
  if (!(this._body instanceof Array)) {
    this._body = this._body ? [this._body] : [];
  }

  for (var i = 0; i < arguments.length; ++i) {
    this._body.push(arguments[i]);
  }

  return this;
};

// Alias for appendBody
AhoyResponseWrapper.prototype.append = AhoyResponseWrapper.prototype.appendBody;

/**
 * Sets status, headers and body in one go.
 *
 * Accepts one parameter, which can be either a string, a
 * Rack-formatted array or a regular object.
 *
 * In case of a string it will set the body to that.
 *
 * In case of an array it must conform to the [status, headers, body]
 * format, where status is a number, headers is a hash and body is
 * any accepted body object.
 *
 * In case of an object it will look for the 'status', 'headers' and/or
 * 'body' properties and set each accordingly.
 *
 * Returns `this'.
 */
AhoyResponseWrapper.prototype.set = function(obj) {
  if (obj instanceof Array) {
    this.status(obj[0]).headers(obj[1]).body(obj[2]);
  } else if (typeof obj === 'object') {
    obj.status && this.status(obj.status);
    obj.headers && this.headers(obj.headers);
    obj.body && this.body(obj.body);
  } else if (typeof obj === 'string') {
    this.body(obj);
  }

  return this;
};

/**
 * Sends data back to the client
 *
 * This fires the "beforeSend" event right before
 * actually sending any data.
 *
 * Options:
 * - omitBody: skips sending the body (use in HEAD requests)
 */
AhoyResponseWrapper.prototype.send = function(options) {
  // Convert send into a No-Op
  this.send = function() { return false };

  // Run callbacks
  this.emit('beforeSend', this);

  options = options || {};

  // Send status and headers
  this._raw.writeHead(this._status, this._headers);

  // Send body (unless omitted)
  if (!options.omitBody) {
    if ((typeof this._body === 'string') || (this._body instanceof Buffer)) {
      this._raw.write(this._body, this._encoding);
    } else {
      var instance = this;
      this._body.forEach(function(chunk) {
        instance._raw.write(chunk, instance._encoding);
      });
    }
  }

  // Close connection
  return this._raw.end();
};

/**
 * Returns whether data has already been sent to the client
 * and the connection was closed
 */
AhoyResponseWrapper.prototype.sent = function() {
  return this._raw.finished;
};

// Export class
exports.wrapper = AhoyResponseWrapper;
