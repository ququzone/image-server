var uuid = require('node-uuid')
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
    yield () => {
      return new Promise((resolve, reject) => {
        utils.streamToUnemptyBuffer(file, (err, buffer) => {
          if (err) {
            ctx.set('Content-Type', 'application/json');
            ctx.body = {success: false, msg: 'read file data error.'};
            return resolve();
          };
          store.addFile(id, buffer, err => {
            ctx.set('Content-Type', 'application/json');
            if (err) {
              ctx.body = {success: false, msg: 'find file from db error.'};
            } else {
              ctx.body = {success: true, id: id};
            }
            return resolve();
          });
        });
      });
    }();
  } else {
    ctx.set('Content-Type', 'application/json');
    ctx.body = {success: false, msg: 'no file found.'};
  }
};
