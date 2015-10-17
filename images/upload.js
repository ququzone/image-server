var uuid = require('node-uuid')
  , Q = require('q')
  , parse = require('co-busboy')
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
  streamToUnemptyBuffer(file, function(err, buffer) {
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

function streamToUnemptyBuffer(stream, callback) {
  var done = false;
  var buffers = [];

  stream.on('data', function (data) {
    buffers.push(data)
  });

  stream.on('end', function () {
    var result, err;
    if (done)
      return;

    done = true;
    result = Buffer.concat(buffers);
    buffers = null;
    if (result.length == 0) {
      err = new Error("Stream yields empty buffer");
      callback(err, null);
    } else {
      callback(null, result);
    }
  });

  stream.on('error', function (err) {
    done = true;
    buffers = null;
    callback(err);
  });
};
