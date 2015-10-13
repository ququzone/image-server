var gm = require('gm')
  , _ = require('underscore')
  , Redis = require('./redis')
  , config = require('../config')
  , mime = require('../images/mime');

function getFileKey(name) {
  return config.redis.prefix + ':file:' + name;
}

function getCacheKey(name) {
  return config.redis.prefix + ':cache:' + name;
}

exports.addFile = function(name, file, callback) {
  gm(file).identify(function(err, data) {
    if(err) return callback('image file error');
    var contentType = mime.types[data.format.toLowerCase()] || mime.default;
    var key = getFileKey(name);
    var redis = Redis.get();

    redis.exists(key, function(err, result) {
      if(err) {
        redis.quit();
        return callback('redis server error');
      };
      if (result === 1) {
        redis.quit();
        return callback('file already exists')
      };
      redis.hmset(
        key,
        {
          mtime: new Date().toUTCString(),
          size: file.length,
          width: data.size.width,
          height: data.size.height,
          mime: contentType,
          data: file
        },
        function(err) {
          redis.quit();
          if (err) {return callback('store image file error')};
          return callback(null);
        }
      );
    });
  });
};

exports.getFileMeta = function(name, callback) {
  var redis = Redis.get();
  var key = getFileKey(name);
  redis.hmget(key, ['mtime', 'size', 'mime'], function(err, data) {
    redis.quit();
    if(err) return callback(err);
    if(_.isEmpty(data)) return callback('file not exists');
    var result = {
      mtime: data[0],
      size: data[1],
      mime: data[2]
    };
    callback(null, result);
  });
};

exports.getFile = function(name, callback) {
  var redis = Redis.get();
  var key = getFileKey(name);
  redis.hgetBuffer(key, 'data', function(err, data) {
    redis.quit();
    if(err) return callback(err);
    callback(null, data);
  });
};

exports.getFileCache = function(name, query, callback) {
  var redis = Redis.get();
  var hname = getCacheKey(name);
  var key = 'w/' + query.w + '/h/' + query.h;
  redis.hgetBuffer(hname, key, function(err, data) {
    if (err) {
      redis.quit();
      return callback('fetch file from redis error');
    }
    if (data) {
      redis.quit();
      return callback(null, data);
    } else {
      redis.hgetBuffer(getFileKey(name), 'data', function(err, originData) {
        if(err) {
          redis.quit();
          return callback('file not found');
        }
        gm(originData)
        .resize(query.w, query.h)
        .toBuffer(function(err, buffer) {
          if(err) {
            redis.quit();
            return callback('file resize error');
          }
          redis.hset(hname, key, buffer, function(err) {
            redis.quit();
            if(err) {
              return callback('set file to redis error');
            }
            return callback(null, buffer);
          });
        });
      });
    }
  });
};
