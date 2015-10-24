var config = require('../config')
  , Redis = require('./redis');

exports.getUser = function(callback) {
  var redis = Redis.get();
  redis.hgetall(config.redis.prefix + ':user', function(err, user) {
    return callback(err, user);
  });
};
