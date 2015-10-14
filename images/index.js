var _ = require('underscore')
  , co = require('co')
  , Q = require('q')
  , crc32 = require('buffer-crc32').unsigned
  , mime = require('./mime')
  , store = require('../store');

exports.get = function *(id) {
  var ctx = this;
  yield get(ctx, id);
};

function get(ctx, id) {
  var deferred = Q.defer();  
  store.getFileMeta(id, function(err, meta) {
    if(err) {
      ctx.set('Content-Type', 'application/json');
      ctx.throw(404, {success: false, msg: 'no file found.'});
      deferred.resolve();
      return;
    }
    if(ctx.fresh) {
      ctx.res.status=304;
      deferred.resolve();
      return;
    }
    store.getFile(id, function(err, file) {
      if(err) {
        ctx.set('Content-Type', 'application/json');
        ctx.throw(500, {success: false, msg: 'file error.'});
      } else {
        ctx.set('Content-Type', meta.mime);
        ctx.body = file;
      }
      deferred.resolve();
    });
  });
  return deferred.promise;
};

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
};

function setHeader(res, meta) {
  // TODO
  // if (!res.getHeader('Accept-Ranges')) res.setHeader('Accept-Ranges', 'bytes');
  if(!res.getHeader('Date')) res.setHeader('Date', new Date().toUTCString());
  if(!res.getHeader('Last-Modified')) res.setHeader('Last-Modified', meta.mtime);
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
