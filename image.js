var fs = require('fs')
  , path = require('path')
  , _ = require('underscore')
  , crc32 = require('buffer-crc32').unsigned
  , fresh = require('fresh')
  , url = require('url')
  , gm = require('gm')
  , mime = require('./mime');

module.exports = function(prefix, root, options) {
  options = options || {};
  if (!prefix) throw new TypeError('request prefix required');
  if (!root) throw new TypeError('root path required');

  return function(req, res, next) {
    if ('GET' != req.method && 'HEAD' != req.method)
      return next();
    var pathname = url.parse(req.url).pathname;

    if(pathname.indexOf(prefix) === 0) {
      var realpath = path.normalize(path.join(root, pathname.substring(prefix.length)));
      if(realpath.indexOf(root) !== 0) {
        return error(res, 403, 'forbidden resource');
      }
      fs.stat(realpath, function(err, stat) {
        if(err) return error(res, 404, 'file not found');
        if(stat.isDirectory()) return error(res, 403, 'forbidden list directory');
        
        setHeader(res, pathname, stat);
        if (isConditionalGET(req) && fresh(req.headers, res._headers)) return notModified(res);

        gm(realpath)
        .format(function (err, format) {
          if(err) return error(res, 404, 'file not found');
          var contentType = mime.types[format.toLowerCase()] || mime.default;
          res.setHeader('Content-Type', contentType);
          if(_.isEmpty(req.query)) {
            var raw = fs.createReadStream(realpath);
            res.statusCode = 200;
            raw.pipe(res);
          } else {
            res.end('hello');
          }
        });
      });
    } else {
      return next();
    }
  }

  function error(res, code, msg) {
    res.statusCode = code;
    res.end(msg);
  }

  function etag(pathname, stat) {
    var tag = String(stat.mtime.getTime()) + ':' + String(stat.size) + ':' + pathname;
    return 'W/"' + crc32(tag) + '"';
  }

  function setHeader(res, pathname, stat) {
    // TODO
    // if (!res.getHeader('Accept-Ranges')) res.setHeader('Accept-Ranges', 'bytes');
    if (!res.getHeader('Date')) res.setHeader('Date', new Date().toUTCString());
    if (!res.getHeader('Last-Modified')) res.setHeader('Last-Modified', stat.mtime.toUTCString());
    if (!res.getHeader('ETag')) {
      var tag = etag(pathname, stat);
      res.setHeader('ETag', tag);
    }
  }

  function isConditionalGET(req) {
    return req.headers['if-none-match']
      || req.headers['if-modified-since'];
  }

  function removeContentHeaderFields(res) {
    _.each(res._headers, function(v, k) {
      if(k.indexOf('content') === 0) {
        res.removeHeader(k);
      }
    });
  }

  function notModified(res) {
    removeContentHeaderFields(res);
    res.statusCode = 304;
    res.end();
  }
}