var sys    = require('sys'),
    assert = require('assert'),
    ahoy   = require('./ahoy');

// Shorthand for empty function
var $ = function() {};

(function() {
  var server = ahoy.init();
  assert.ok(server instanceof Ahoy, 'AhoyModule.init() must return an Ahoy instance.');
})();

// Method chaining
(function() {
  var server = ahoy.init();
  assert.equal(server.handler('get', '/foo', $), server, 'Ahoy#handler() should return self');
  assert.equal(server.get('/foo', $), server, 'Ahoy#get() should return self');
  assert.equal(server.post('/foo', $), server, 'Ahoy#post() should return self');
  assert.equal(server.before('/foo', $), server, 'Ahoy#before() should return self');
  assert.equal(server.after('/foo', $), server, 'Ahoy#after() should return self');
  assert.equal(server.catchAll($), server, 'Ahoy#catchAll() should return self');
})();

// Filter registration and matching
['before', 'after'].forEach(function(f) {
  var ff = f + 'Filters';

  (function() {
    var server = ahoy.init();
    server[f]($);
    assert.deepEqual(server[ff]('/foo'), [$], 'When adding a ' + f + ' filter with free match, Ahoy#' + ff + ' must include that filter for any URL.');
    assert.deepEqual(server[ff]('/bar'), [$], 'When adding a ' + f + ' filter with free match, Ahoy#' + ff + ' must include that filter for any URL.');
    assert.deepEqual(server[ff]('/foo/bar'), [$], 'When adding a ' + f + ' filter with free match, Ahoy#' + ff + ' must include that filter for any URL.');
  })();

  (function() {
    var server = ahoy.init();
    server[f](/foo$/, $);
    assert.deepEqual(server[ff]('/foo'), [$], 'When adding a ' + f + ' filter with a regexp match, Ahoy#' + ff + ' must include that filter for any URL matching the regexp.');
    assert.deepEqual(server[ff]('/foofoo'), [$], 'When adding a ' + f + ' filter with a regexp match, Ahoy#' + ff + ' must include that filter for any URL matching the regexp.');
    assert.deepEqual(server[ff]('/foos'), [], 'When adding a ' + f + ' filter with a regexp match, Ahoy#' + ff + ' must not include that filter for any URL not matching the regexp.');
  })();

  (function() {
    var server = ahoy.init();
    server[f]('/foo', $);
    assert.deepEqual(server[ff]('/foo'), [$], 'When adding a ' + f + ' filter with a string match, Ahoy#' + ff + ' must include that filter for any URL equal to that string.');
    assert.deepEqual(server[ff]('/bar'), [], 'When adding a ' + f + ' filter with a string match, Ahoy#' + ff + ' must not include that filter for any URL not equal to that string.');
  })();
});
