var gm = require('gm')
  , _ = require('underscore')
  , Canvas = require('canvas')
  , smartcrop = require('../lib/smartcrop')
  , seaweedfs = require('../lib/seaweedfs')
  , mime = require('../lib/mime')
  , utils = require('../lib/utils')
  , config = require('../config')
  , Redis = require('./redis');

function getFileKey(name) {
  return config.redis.prefix + ':file:' + name;
}

function getCacheKey(name) {
  return config.redis.prefix + ':cache:' + name;
}

function getSmartKey(name) {
  return config.redis.prefix + ':smart:' + name;
}

exports.addFile = function(name, file, callback) {
  gm(file).identify(function(err, data) {
    if (err) return callback('image file error');
    var contentType = mime.types[data.format.toLowerCase()] || mime.default;
    var key = getFileKey(name);
    var redis = Redis.get();

    redis.exists(key, function(err, result) {
      if (err) {
        redis.quit();
        return callback('redis server error');
      };
      if (result === 1) {
        redis.quit();
        return callback('file already exists')
      };
      seaweedfs.writeFile(file, (err, fid) => {
        if (err) return callback(err);
        redis.multi().hmset(key, {
          mtime: new Date().toUTCString(),
          size: file.length,
          width: data.size.width,
          height: data.size.height,
          mime: contentType,
          dfid: fid
        }).lpush(config.redis.prefix + ':all', name).exec(function(err) {
          redis.quit();
          if (err) {return callback('store image file error')};
          return callback(null);
        });
      });
    });
  });
};

exports.getFileMeta = function(name, callback) {
  var redis = Redis.get();
  var key = getFileKey(name);
  redis.hmget(key, ['mtime', 'size', 'mime'], function(err, data) {
    redis.quit();
    if (err) return callback(err);
    for (var i = 0; i < data.length; i++) {
      if (data[i] === null) {
        return callback('file not exists');
      }
    }
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
  redis.hget(key, 'dfid', function(err, data) {
    redis.quit();
    if(err) return callback(err);
    seaweedfs.getFile(data, (err, file) => {
      if(err) return callback(err);
      callback(null, file);
    });
  });
};

exports.getFileCache = function(name, query, callback) {
  var redis = Redis.get();
  var hname = getCacheKey(name);
  var key = 'w/' + query.w + '/h/' + query.h;
  redis.hget(hname, key, function(err, data) {
    if (err) {
      redis.quit();
      return callback('fetch file from redis error');
    }
    if (data) {
      redis.quit();
      seaweedfs.getFile(data, (err, file) => {
        if(err) return callback(err);
        callback(null, file);
      });
      return;
    } else {
      redis.hget(getFileKey(name), 'dfid', function(err, data) {
        if (err) {
          redis.quit();
          return callback('file not found');
        }
        seaweedfs.getFile(data, (err, file) => {
          if(err) return callback(err);
          gm(file)
          .resize(query.w, query.h)
          .toBuffer(function(err, buffer) {
            if (err) {
              redis.quit();
              return callback('file resize error');
            }
            seaweedfs.writeFile(buffer, (err, fid) => {
              if(err) return callback(err);
              redis.hset(hname, key, fid, function(err) {
                redis.quit();
                if (err) {
                  return callback('set fid to redis error');
                }
                return callback(null, buffer);
              });
            });
          });
        });
      });
    }
  });
};

exports.getSmartFile = function(name, query, callback) {
  var redis = Redis.get();
  var hname = getSmartKey(name);
  var key = 'w/' + query.w + '/h/' + query.h;
  redis.hget(hname, key, function(err, data) {
    if (err) {
      redis.quit();
      return callback('fetch file from redis error');
    }
    if (data) {
      redis.quit();
      seaweedfs.getFile(data, (err, file) => {
        if(err) return callback(err);
        callback(null, file);
      });
      return;
    } else {
      redis.hget(getFileKey(name), 'dfid', function(err, data) {
        if (err) {
          redis.quit();
          return callback('file not found');
        }
        seaweedfs.getFile(data, (err, file) => {
          if(err) return callback(err);
          var img = new Canvas.Image()
            , options = _.extend({canvasFactory: function(w, h){ return new Canvas(w, h); }}, {width:parseInt(query.w), height:parseInt(query.h)});
          img.src = file;
          smartcrop.crop(img, options, function(result) {
            var canvas = new Canvas(options.width, options.height)
              , context = canvas.getContext('2d')
              , crop = result.topCrop;
            context.patternQuality = 'best';
            context.filter = 'best';
            context.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
            utils.streamToUnemptyBuffer(canvas.syncJPEGStream({quality: 90}), function(err, cropData) {
              if (err) {
                redis.quit();
                return callback('file crop error.');
              } else {
                seaweedfs.writeFile(cropData, (err, fid) => {
                  if(err) return callback(err);
                  redis.hset(hname, key, fid, function(err) {
                    redis.quit();
                    if (err) {
                      return callback('set file to redis error');
                    }
                    return callback(null, cropData);
                  });
                });
              }
            });
          });
        });
      });
    }
  });
};

exports.getAllPage = function(page, callback) {
  if (page <= 0) {
    page = 1;
  }
  var start = (page - 1) * 20;
  var end = start + 20;
  var redis = Redis.get();
  redis.lrange(config.redis.prefix + ':all', start, end, (err, data) => {
    redis.quit();
    callback(err, data);
  });
};
