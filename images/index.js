var _ = require('underscore')
  , crc32 = require('buffer-crc32').unsigned
  , fresh = require('fresh')
  , url = require('url')
  , mime = require('./mime')
  , store = require('../store');

exports.get = function(req, res) {
  store.getFileMeta(req.params.id, function(err, meta) {
    if(err) return error(res, 404, 'file not found');
    var pathname = url.parse(req.url).pathname;
    setHeader(res, pathname, meta);
    if(isConditionalGET(req) && fresh(req.headers, res._headers)) return notModified(res);
    store.getFile(req.params.id, function(err, file) {
      if(err) return error(res, 500, 'file error');
      res.setHeader('Content-Type', meta.mime);
      res.statusCode = 200;
      res.end(file);
    });
  });
}

exports.imageview = function(req, res) {
  store.getFileMeta(req.params.id, function(err, meta) {
    if(err) return error(res, 404, 'file not found');
    var pathname = url.parse(req.url).pathname;
    setHeader(res, pathname, meta);
    if(isConditionalGET(req) && fresh(req.headers, res._headers)) return notModified(res);
    if(_.isEmpty(req.query)) return error(res, 404, 'miss request params');
    var query = {}
    query.w = req.query.w || null
    query.h = req.query.h || null;
    store.getFileCache(req.params.id, query, function(err, data) {
      if(err) return error(res, 404, err);
      res.setHeader('Content-Type', meta.mime);
      res.statusCode = 200;
      res.end(data);
    });
  });
}

function setHeader(res, pathname, meta) {
  // TODO
  // if (!res.getHeader('Accept-Ranges')) res.setHeader('Accept-Ranges', 'bytes');
  if(!res.getHeader('Date')) res.setHeader('Date', new Date().toUTCString());
  if(!res.getHeader('Last-Modified')) res.setHeader('Last-Modified', meta.mtime.toUTCString());
  /* remove etag setting, because can not know cache file's size
  if(!res.getHeader('ETag')) {
    var tag = etag(pathname, meta);
    res.setHeader('ETag', tag);
  } */
}

function etag(pathname, meta) {
  var tag = String(meta.mtime.getTime()) + ':' + String(meta.size) + ':' + pathname;
  return 'W/"' + crc32(tag) + '"';
}

function notModified(res) {
  removeContentHeaderFields(res);
  res.statusCode = 304;
  res.end();
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

function error(res, code, msg) {
  res.statusCode = code;
  res.end(msg);
}
