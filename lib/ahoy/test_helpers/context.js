var assert = require('assert'),
    sys    = require('sys');

var Context = function() {
  var block;

  if (arguments.length == 1) {
    block = arguments[0];
  } else {
    this._message = arguments[0];
    this._parent = arguments[2];
    block = arguments[1];
  }

  this.setup();

  block.call(this, this);

  //if (!this._parent) sys.print('\n');
};

var context = function() {
  if (arguments.length == 1) {
    return new Context(arguments[0]);
  } else if (arguments.length == 2) {
    return new Context(arguments[0], arguments[1]);
  } else {
    return new Context(arguments[0], arguments[1], arguments[2]);
  }
};

Context.prototype.build = function() {
  if (this._message) {
    return (this._parent ? (this._parent.build() + this._message) : this._message) + ' ';
  } else {
    return this._parent ? this._parent.build() : '';
  }
};

Context.prototype.context = function() {
  if (arguments.length == 1) {
    new Context(undefined, arguments[0], this);
  } else {
    new Context(arguments[0], arguments[1], this);
  }
};

Context.prototype.setup = function() {
  if (arguments.length == 0) {
    if (this._parent) this._parent.setup();
    if (this._setup) this._setup();
  } else {
    this._setup = arguments[0];
    return this;
  }
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

exports.context = context;
