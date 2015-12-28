"use strict"

var http = require('http')
  , _ = require('underscore')
  , config = require('../config');

exports.getFile = function(fid, callback) {
  var idi = fid.split(',');
  http.get(config.seaweedfs + '/dir/lookup?volumeId='+idi[0], function(res) {
    res.body
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
};
