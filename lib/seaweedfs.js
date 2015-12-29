"use strict"

var http = require('http')
  , FormData = require('form-data')
  , config = require('../config');

exports.getFile = function(fid, callback) {
  var idi = fid.split(',');
  http.get('http://' + config.seaweedfs.host + ':' + config.seaweedfs.port + '/dir/lookup?volumeId='+idi[0], res => {
    var body = '';
    res.on('data', data => {
      body += data;
    });
    res.on('end', () => {
      var fileMeta = JSON.parse(body);
      http.get('http://' + fileMeta.locations[0].url + '/' + fid, fr => {
        var bufs = [];
        fr.on('data', chunk => {
          bufs.push(chunk);
        });
        fr.on('end', () => {
          callback(null, Buffer.concat(bufs));
        });
      }).on('error', e => {
        callback('get file data error');
      });
    });
  }).on('error', e => {
    callback('lookup file data error');
  });
};

exports.writeFile = function(file, callback) {
  var assginOptions = {
    hostname: config.seaweedfs.host,
    port: config.seaweedfs.port,
    method: 'POST',
    path: '/dir/assign'
  };
  var assginReq = http.request(assginOptions, res => {
    var body = '';
    res.on('data', data => {
      body += data;
    });
    res.on('end', () => {
      var assginInfo = JSON.parse(body);
      var url = assginInfo.url.split(':');
      var form = new FormData();
      form.append('file', file);
      var options = {
        hostname: url[0],
        port: url[1],
        method: 'PUT',
        path: '/' + assginInfo.fid,
        headers: form.getHeaders()
      };
      var req = http.request(options);
      form.pipe(req);
      req.on('error', e => {
        callback('write file data error');
      });
      req.on('response', res => {
        callback(null, assginInfo.fid);
      });
    });
  });

  assginReq.on('error', e => {
    callback('assgin file error');
  });
  assginReq.end();
};
