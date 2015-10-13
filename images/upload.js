var multiparty = require('multiparty')
  , uuid = require('node-uuid')
  , utils = require('./utils')
  , store = require('../store');

module.exports = function(req, res) {
  var form = new multiparty.Form();
  form.on('error', function() {
    utils.writeJSON(res, {success: false, msg: 'upload file fail.'});
  });
  var size = 0, buffers = [];
  form.on('part', function(part) {
    if (!part.filename) return;
    part.on('data', function(chunk) {
      buffers.push(chunk);
      size += chunk.length;
    });
  });
  form.on('close', function() {
    if(buffers.length < 1) {
      utils.writeJSON(res, {success: false, msg: 'empty file error.'});
      return;
    }
    var buffer = new Buffer(size);
    for (var i = 0, pos = 0, l = buffers.length; i < l; i++) {
      var chunk = buffers[i];
      chunk.copy(buffer, pos);
      pos += chunk.length;
    }
    var id = uuid.v4(); 
    store.addFile(id, buffer, function(err) {
      if(err) {
        utils.writeJSON(res, {success: false, msg: err});
        return;
      }
      utils.writeJSON(res, {success: true, id: id});
    });
  });
  form.parse(req);
};