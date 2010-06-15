var System = require('sys'),
    URL    = require('url');

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

  var handlers = this.match(req.method, req.url.pathname);
  var responseWrapper = new AhoyResponseWrapper(res);

  // Add after filters as event handlers for the response wrapper
  // on "beforeSend"
  this.afterFilters(req.url).forEach(function(filter) {
    responseWrapper.addListener('beforeSend', filter);
  });

  // Call handlers in order, passing them the request and response
  // objects, plus a method to call the next handler
  var i = 0;
  var next = function() {
    if (i < handlers.length) {
      var handler = handlers[i++];

      if (handler.length == 3) {
        handler(req, responseWrapper, next);
      } else {
        responseWrapper.set(handler(req, responseWrapper));
        next();
        return;
      }
    } else {
      // If the end of the chain is reached, just flush the response
      responseWrapper.send();
    }
  };
  next();
};
