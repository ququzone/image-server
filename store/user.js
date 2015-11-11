var config = require('../config')
  , Redis = require('./redis');

exports.getUser = function(callback) {
  var redis = Redis.get();
  redis.hgetall(config.redis.prefix + ':user', (err, user) => {
    redis.quit();
    return callback(err, user);
  });
};

exports.addUser = (user, callback) => {
  var redis = Redis.get();
  redis.hmset(config.redis.prefix + ':user', user, err => {
    redis.quit();
    callback(err)
  });
};
