var System      = require('sys'),
    URL         = require('url'),
    QueryString = require('querystring');

var AhoyResponseWrapper = require('./response_wrapper').wrapper;

/**
 * Ahoy core request handler
 *
 * Access to the Ahoy instance is provided through `this'
 */
exports.handler = function(req, res) {
  System.puts('Processing ' + req.url);

  // Extend original request with parsed URL
  req.url = URL.parse(req.url, true);

  // Find all matching handlers
  var handlers = this.beforeFilters(req.url.pathname).concat(this.match(req.method, req.url.pathname));

  // Create the response wrapper
  var responseWrapper = new AhoyResponseWrapper(res);

  // Catch and decode POST data
  if (req.method == 'POST' || req.method == 'PUT') {
    // See if we have a decoder available
    var decoder = this._decoders[req.headers['content-type']];

    // Asume all decoders work with strings instead of binary data
    if (decoder) req.setEncoding('utf8');

    req.addListener('data', function(chunk) {
      req.data = decoder ? decoder(chunk) : chunk;
    });
  }

  // Add after filters as event handlers for the response wrapper
  // on "beforeSend"
  this.afterFilters(req.url).forEach(function(filter) {
    responseWrapper.addListener('beforeSend', function() {
      filter.call(responseWrapper);
    });
  });

  // Call handlers in order, passing them the request and response
  // objects, plus a method to call the next handler
  var i = 0;
  var next = function() {
    if (i < handlers.length) {
      var handler = handlers[i++];
      handler.call(responseWrapper, req, next);
    } else if (i == handlers.length) {
      // If the end of the chain is reached, flush the response
      responseWrapper.send();
    } else {
      throw('Called next() at end of chain.');
    }
  };

  // Extend responseWrapper with request and next
  responseWrapper.request = req;
  responseWrapper.next = next;

  // Start traversing the chain
  req.addListener('end', next);
};
