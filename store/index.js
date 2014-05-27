var gm = require('gm')
  , SSDB = require('./SSDB')
  , config = require('../config')
  , mime = require('../images/mime');

function getFileKey(name) {
  return config.ssdb.prefix + ':file:' + name;
}

function getCacheKey(name) {
  return config.ssdb.prefix + ':cache:' + name;
}

exports.addFile = function(name, file, callback) {
  gm(file).identify(function(err, data) {
    if(err) return callback('image file error');
    var contentType = mime.types[data.format.toLowerCase()] || mime.default;
    var ssdb = SSDB.connect(config.ssdb.host, config.ssdb.port, config.ssdb.timeout);
    var key = getFileKey(name);
    ssdb.hsize(key, function(err, size) {
      if(err || size !== 0) {
        ssdb.close();
        return callback('file already exists');
      }
      ssdb.multi_hset(
        key, 
        {
          mtime: new Date().getTime(),
          size: file.length,
          width: data.size.width,
          height: data.size.height,
          mime: contentType,
          data: file
        },
        function(err) {
          ssdb.close();
          if(err) {
            return callback('set file to ssdb error');
          }
          return callback(null);
        }
      );
    });
  });
}

exports.getFileMeta = function(name, callback) {
  var ssdb = SSDB.connect(config.ssdb.host, config.ssdb.port, config.ssdb.timeout);
  var key = getFileKey(name);
  ssdb.multi_hget(key, ['mtime', 'size', 'mime'], function(err, data) {
    ssdb.close();
    if(err) return callback(err);
    var d = new Date()
    d.setTime(data.mtime.toString())
    data.mtime = d;
    data.size = data.size.toString();
    data.mime = data.mime.toString();
    callback(null, data);
  });
}

exports.getFile = function(name, callback) {
  var ssdb = SSDB.connect(config.ssdb.host, config.ssdb.port, config.ssdb.timeout);
  var key = getFileKey(name);
  ssdb.hget(key, 'data', function(err, data) {
    ssdb.close();
    if(err) return callback(err);
    callback(null, data);
  });
}

exports.getFileCache = function(name, query, callback) {
  var ssdb = SSDB.connect(config.ssdb.host, config.ssdb.port, config.ssdb.timeout);
  var hname = getCacheKey(name);
  var key = 'w/' + query.w + '/h/' + query.h;
  ssdb.hget(hname, key, function(err, data) {
    if(err) {
      ssdb.hget(getFileKey(name), 'data', function(err, originData) {
        if(err) {
          ssdb.close();
          return callback('file not found');
        }
        gm(originData)
        .resize(query.w, query.h)
        .toBuffer(function(err, buffer) {
          if(err) {
            ssdb.close();
            return callback('file resize error');
          }
          ssdb.hset(hname, key, buffer, function(err) {
            ssdb.close();
            if(err) {
              return callback('set file to ssdb error');
            }
            return callback(null, buffer);
          });
        });
      });
    } else {
      ssdb.close();
      return callback(null, data);
    }
  });
}