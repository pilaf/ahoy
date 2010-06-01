var HTTP = require('http'),
    URL  = require('url');

var handleRequest = function(req, res) {
  var url = URL.parse(req.url, true);
  var handler;

  if (req.method == 'GET') {
    handler = this._getRoutes[url.pathname];
  } else if (req.method == 'POST') {
    handler = this._postRoutes[url.pathname];
  }

  if (handler === undefined) {
    handler = this._notFoundHandler || Ahoy.defaultNotFoundHandler;
  }

  req.parsedURL = url;

  var handlerResponse = handler(req),
      status = 200,
      headers = {},
      content;

  if (typeof handlerResponse == 'string') {

    content = handlerResponse;

  } else if (typeof handlerResponse == 'object') {
    
    // Sniff for an array
    if (handlerResponse.forEach) {
      if (handlerResponse.length == 3) {

        status = handlerResponse[0];
        headers = handlerResponse[1];
        content = handlerResponse[2];

      } else if (handlerResponse.length == 2) {

        if (handlerResponse[0] == 'number') {
          status = handlerResponse[0];
        } else if (handlerResponse[0] == 'object') {
          headers = handlerResponse[0];
        }

        content = handlerResponse[1];
      }
    }
  }

  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'text/plain';
  }

  headers['Content-Length'] = content.length;

  res.writeHead(status, headers);
  res.end(content);

};

var Ahoy = function() {
  var instance = this;

  this._beforeFilters = {};
  this._getRoutes = {};
  this._postRoutes = {};

  this._server = HTTP.createServer(function(req, res) { handleRequest.call(instance, req, res); });
}

Ahoy.defaultNotFoundHandler = function(req) {
  return [404, {'Content-Type': 'text/html'}, '<!DOCTYPE html><html><head><title>404 - Not found<title></head><body><h1>404 - Not found</h1></body></html>'];
};

Ahoy.prototype.start = function(port, host) {
  this._server.listen(port, host);
};

Ahoy.prototype.stop = function() {
  this._server.close();
};

Ahoy.prototype.get = function(path, handler) {
  this._getRoutes[path] = handler;
};

Ahoy.prototype.post = function(path, handler) {
  this._postRoutes[path] = handler;
};

Ahoy.prototype.beforeFilter = function(paths, handler) {
  var instance = this;

  Array(paths).forEach(function(path) {
    if (instance._beforeFilters[path] === undefined) {
      instance._beforeFilters[path] = [];
    }

    instance._beforeFilters[path].push(handler);
  });
};

Ahoy.prototype.notFound = function(handler) {
  this._notFoundHandler = handler;
};

/*
exports.serveFile = function(filename, type) {
  return function(req, res) {
    FileSystem.readFile(filename, function(err, data) {
      if (err) {
      } else {
        res
        data = data;
      }
    });

    return [{'Content-Type': type}, data];
  };
};
*/

exports.init = function() {
  return new Ahoy;
};
