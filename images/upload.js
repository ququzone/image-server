var uuid = require('node-uuid')
  , Q = require('q')
  , parse = require('co-busboy')
  , utils = require('../lib/utils')
  , store = require('../store');

module.exports = function *() {
  var ctx = this;
  var parts = parse(this, {
    autoFields: true
  });
  var file = yield parts;
  if (file) {
    var id = uuid.v4();
    yield addFile(ctx, id, file);
  } else {
    ctx.set('Content-Type', 'application/json');
    ctx.body = {success: false, msg: 'no file found.'};
  }
};

function addFile(ctx, id, file) {
  var deferred = Q.defer();
  utils.streamToUnemptyBuffer(file, function(err, buffer) {
    if (err) {
      ctx.set('Content-Type', 'application/json');
      ctx.body = {success: false, msg: 'read file data error.'};
      deferred.resolve();
      return;
    };
    store.addFile(id, buffer, function(err) {
      ctx.set('Content-Type', 'application/json');
      if (err) {
        ctx.body = {success: false, msg: 'find file from db error.'};
      } else {
        ctx.body = {success: true, id: id};
      }
      deferred.resolve();
    });
  });
  return deferred.promise;
};
