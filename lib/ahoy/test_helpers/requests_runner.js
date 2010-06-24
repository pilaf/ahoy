var http = require('http');

// Simple class to run a number of HTTP requests with a callback
exports.RequestsRunner = function(port, host) {
  var client = http.createClient(port, host);

  this.requests = function(requests, finish) {
    var missingRequests = requests.length;

    requests.forEach(function(args) {
      var handler = args.pop();
      var body = (args[args.length - 1] instanceof Array) ? args.pop() : [];

      var request = client.request.apply(client, args);
      body.forEach(function(chunk) { request.write(chunk) });
      request.end();

      request.addListener('response', function(response) {
        response.body = [];

        response.setEncoding('utf8');

        response.addListener('data', function(chunk) {
          response.body.push(chunk);
        });

        response.addListener('end', function() {
          handler.call(response, response);
          (!--missingRequests) && finish();
        });
      });
    });

    return this;
  };
};
