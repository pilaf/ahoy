var sys     = require('sys'),
    assert  = require('assert'),
    http    = require('http'),
    ahoy    = require('./ahoy'),
    context = require('./test_helpers/context').context,
    RequestsRunner = require('./test_helpers/requests_runner').RequestsRunner;

// Shorthand for empty function
var $F = function() {};

// Shorthand for inspecting objects
var inspect = function(object) { sys.puts(sys.inspect(object)) };

// Shorthand to announce tests
var test = function(name) { sys.puts('*** Test *** ' + name) };

test('Initialization');
(function() {
  var server = ahoy.init();
  assert.ok(server instanceof Ahoy, 'When calling init() on the Ahoy module it must return an Ahoy instance.');
})();

test('Method chaining');
(function() {
  var server = ahoy.init();
  assert.equal(server.handler('get', '/foo', $F), server, 'Ahoy#handler() should return self');
  assert.equal(server.get('/foo', $F), server, 'Ahoy#get() should return self');
  assert.equal(server.post('/foo', $F), server, 'Ahoy#post() should return self');
  assert.equal(server.before('/foo', $F), server, 'Ahoy#before() should return self');
  assert.equal(server.after('/foo', $F), server, 'Ahoy#after() should return self');
  assert.equal(server.catchAll($F), server, 'Ahoy#catchAll() should return self');
})();

test('Filter registration and matching');
['before', 'after'].forEach(function(f) {
  var ff = f + 'Filters';

  context('When adding a ' + f + ' filter with free match', function() {
    var server = ahoy.init();
    server[f]($F);

    this.deepEqual(server[ff]('/foo'), [$F], 'Ahoy#' + ff + ' must include that filter for any URL.');
    this.deepEqual(server[ff]('/bar'), [$F], 'Ahoy#' + ff + ' must include that filter for any URL.');
    this.deepEqual(server[ff]('/foo/bar'), [$F], 'Ahoy#' + ff + ' must include that filter for any URL.');
  });

  context('When adding a ' + f + ' filter with a regexp match', function() {
    var server = ahoy.init();
    server[f](/foo$/, $F);

    this.deepEqual(server[ff]('/foo'), [$F], 'Ahoy#' + ff + ' must include that filter for any URL matching the regexp.');
    this.deepEqual(server[ff]('/foofoo'), [$F], 'Ahoy#' + ff + ' must include that filter for any URL matching the regexp.');
    this.deepEqual(server[ff]('/foos'), [], 'Ahoy#' + ff + ' must not include that filter for any URL not matching the regexp.');
  });

  context('When adding a ' + f + ' filter with a string match', function() {
    var server = ahoy.init();
    server[f]('/foo', $F);

    this.deepEqual(server[ff]('/foo'), [$F], 'Ahoy#' + ff + ' must include that filter for any URL equal to that string.');
    this.deepEqual(server[ff]('/bar'), [], 'Ahoy#' + ff + ' must not include that filter for any URL not equal to that string.');
  });
});

test('Basic server response');
context('When setting up a minimal server', function() {
  var server = ahoy.init();

  server.get('/', function() { this.status(200).contentType('text/plain').header('content-length', 3).body('Foo').send() });

  server.catchAll(function() { this.status(404).send() });

  server.start(8000, 'localhost');

  var me = this;

  new RequestsRunner(8000, 'localhost').requests([
    ['/', function(response) {
      me.context('and requesting GET to root', function() {
        this.equal(response.statusCode, 200, 'status code must be 200');
        this.equal(response.headers['content-type'], 'text/plain', 'content-type must be "text/plain".');
        this.equal(response.body[0], 'Foo', 'body must be "Foo".');
      });
    }],

    ['/missing', function(response) {
      me.context('and requesting GET to an undefined route', function() {
        this.equal(response.statusCode, 400, 'status code must be 404');
      });
    }]
  ], function() {
    server.stop();
  });
});
