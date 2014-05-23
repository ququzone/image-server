var async = require('async')
  , SSDB = require('./SSDB')
  , config = require('../config');

function getFileKey(name) {
  return config.ssdb.prefix + ':file:' + name;
}

function getCacheKey(name) {
  return config.ssdb.prefix + ':cache:' + name;
}

exports.addFile = function(name, file, callback) {
  var ssdb = SSDB.connect(config.ssdb.host, config.ssdb.port, config.ssdb.timeout);
  var key = getFileKey(name);
  ssdb.hsize(key, function(err, size) {
    if(err || size !== 0) {
      ssdb.close();
      return callback('file already exists');
    }
    ssdb.multi_set(
      key, 
      {mtime: new Date().toUTCString(), size: file.length, data: file},
      function(err) {
        //ssdb.close();
        if(err) {
          return callback('set file to ssdb error');
        }
        return callback(null);
      }
    );
  });
}

exports.addCache = function(name, version, file, callback) {
  //
}