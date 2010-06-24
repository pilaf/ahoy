var assert = require('assert'),
    sys    = require('sys');

var Context = function(message, block, parentContext) {
  this._message = message;
  this._parent = parentContext;
  block.call(this, this);
  //if (!this._parent) sys.print('\n');
};

Context.prototype.build = function() {
  return (this._parent ? (this._parent.build() + this._message) : this._message) + ' ';
};

Context.prototype.context = function(message, block) {
  new Context(message, block, this);
};

Context.prototype.assert = function(method, _arguments) {
  var args = Array.prototype.slice.call(_arguments, 0, -1);
  args.push(this.build() + _arguments[_arguments.length - 1]);

  assert[method].apply(assert, args);

  /*
  try {
    assert[method].apply(assert, args);
    sys.print('.');
  } catch(e) {
    if (e instanceof assert.AssertionError) {
      sys.print('F');
    } else {
      sys.print('E');
      throw e;
    }
  }
  */
};

['ok', 'equal', 'notEqual', 'deepEqual', 'notDeepEqual', 'strictEqual', 'notStrictEqual', 'throws', 'doesNotThrow'].forEach(function(method) {
  Context.prototype[method] = function() { this.assert(method, arguments) }
});

exports.context = function(message, block) { return new Context(message, block) };
