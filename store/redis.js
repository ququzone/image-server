"use strict";

var config = require('../config');
var Redis = require('ioredis');

exports.get = function() {
  return new Redis({
    port: config.redis.port,
    host: config.redis.host,
    family: 4,
    db: 0
  });
};