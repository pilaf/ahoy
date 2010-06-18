var System = require('sys');

/**
 * Start the server listening
 *
 * By default listens on localhost:8000
 */
this.start = function(port, host) {
  this._server.listen(port || Ahoy.DEFAULT_PORT, host);
  System.puts('Ahoy! ' + (host || 'localhost') + ':' + (port || Ahoy.DEFAULT_PORT));
  return this;
};

/**
 * Registers a new handler for the given HTTP method
 */
this.handler = function(method, match, handler) {
  var handlers = this._handlers[method.toLowerCase()];

  if (!handlers) {
    throw new Error('Invalid HTTP method. Supported methods are "get" and "post".');
  }

  if (typeof match === 'string') {
    handlers.exact[match] = handler;
  } else if ((match instanceof RegExp) || (match instanceof Function)) {
    handlers.fuzzy.push([match, handler]);
  }

  return this;
};

/**
 * Shorthand for #handler('get', ...)
 */
this.get = function(match, handler) {
  return this.handler('get', match, handler);
};

/**
 * Shorthand for #handler('post', ...)
 */
this.post = function(match, handler) {
  return this.handler('post', match, handler);
};

/**
 * Private function
 */
var registerFilter = function(stack, args) {
  if (args.length == 1) {
    stack.push([undefined, args[0]]);
  } else if (args.length == 2) {
    stack.push([args[0], args[1]]);
  } else {
    stack.push([Array.prototype.slice.call(args, 0, args.length - 1), args[args.length - 1]]);
  }
};

/**
 * Registers a new before filter
 */
this.before = function() {
  registerFilter(this._beforeFilters, arguments);
  return this;
};

/**
 * Registers a new after filter
 */
this.after = function(matches, handler) {
  registerFilter(this._afterFilters, arguments);
  return this;
};

/**
 * Registers a new catch-all handler
 */
this.catchAll = function(handler) {
  this._catchAll.push(handler);
  return this;
};

/**
 * Private function
 */
var matchIn = function(handlers, url) {
  selection = [];
  handlers.forEach(function(handler) {
    if (handler[0] === undefined) {
      selection.push(handler[1]);
    } else {
      var matches = (handler[0] instanceof Array) ? handler[0] : [handler[0]];
      for (var i = 0; i < matches.length; ++i) {
        switch (true) {
          case (typeof matches[i] === 'function') && matches[i](url):
          case (typeof matches[i] === 'string') && (matches[i] == url):
            selection.push(handler[1]);
        }
      }
    }
  });
  return selection;
};

/**
 * Tries to match an HTTP method and URL with all available
 * handlers, and returns an array of all found handlers in the
 * order they were registered
 */
this.match = function(method, url) {
  method = method.toLowerCase();

  // If we find an exact match ignore all the rest
  if (this._handlers[method].exact[url]) {
    return [this._handlers[method].exact[url]];
  }

  var handlers = matchIn(this._handlers[method].fuzzy, url);

  // Append catch-all handlers and return
  return handlers.concat(this._catchAll);
};

this.beforeFilters = function(url) {
  return matchIn(this._beforeFilters, url);
};

this.afterFilters = function(url) {
  return matchIn(this._afterFilters, url);
};
