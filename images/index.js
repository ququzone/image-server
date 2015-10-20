var _ = require('underscore')
  , Q = require('q')
  , Canvas = require('canvas')
  , smartcrop = require('./smartcrop')
  , crc32 = require('buffer-crc32').unsigned
  , mime = require('./mime')
  , store = require('../store')
  , utils = require('./utils');

exports.get = function *(id) {
  var ctx = this;
  yield get(ctx, id);
};

function get(ctx, id) {
  var deferred = Q.defer();
  store.getFileMeta(id, function(err, meta) {
    if (err) {
      ctx.set('Content-Type', 'application/json');
      ctx.throw(404, {success: false, msg: 'no file found.'});
      deferred.resolve();
      return;
    }
    store.getFile(id, function(err, file) {
      if (err) {
        ctx.set('Content-Type', 'application/json');
        ctx.throw(500, {success: false, msg: 'file error.'});
      } else {
        setCacheHeader(ctx, meta, file);
        if (ctx.fresh) {
          ctx.status = 304;
        } else {
          ctx.set('Content-Type', meta.mime);
          ctx.body = file;
        }
      }
      deferred.resolve();
    });
  });
  return deferred.promise;
};

exports.imageview = function *(id) {
  var ctx = this;
  yield imageview(ctx, id);
};

function imageview(ctx, id) {
  var deferred = Q.defer();
  store.getFileMeta(id, function(err, meta) {
    if (err) {
      ctx.set('Content-Type', 'application/json');
      ctx.throw(404, {success: false, msg: 'no file found.'});
      deferred.resolve();
      return;
    }
    if (_.isEmpty(ctx.query)) {
      ctx.set('Content-Type', 'application/json');
      ctx.throw(404, {success: false, msg: 'miss request params.'});
      deferred.resolve();
      return;
    }
    var query = {}
    query.w = ctx.query.w || null
    query.h = ctx.query.h || null;
    store.getFileCache(id, query, function(err, data) {
      if (err) {
        ctx.set('Content-Type', 'application/json');
        ctx.throw(404, {success: false, msg: 'no file found.'});
      } else {
        setCacheHeader(ctx, meta, data);
        if (ctx.fresh) {
          ctx.status = 304;
        } else {
          ctx.set('Content-Type', meta.mime);
          ctx.body = data;
        }
      }
      deferred.resolve();
    });
  });
  return deferred.promise;
};

exports.smart = function *(id) {
  var ctx = this;
  yield smart(ctx, id);
};

function smart(ctx, id) {
  var deferred = Q.defer();
  store.getFileMeta(id, function(err, meta) {
    if (err) {
      ctx.set('Content-Type', 'application/json');
      ctx.throw(404, {success: false, msg: 'no file found.'});
      deferred.resolve();
      return;
    }
    store.getFile(id, function(err, file) {
      if (err) {
        ctx.set('Content-Type', 'application/json');
        ctx.throw(500, {success: false, msg: 'file error.'});
        deferred.resolve();
      } else {
        var img = new Canvas.Image()
          , options = _.extend({canvasFactory: function(w, h){ return new Canvas(w, h); }}, {width:300, height:200});
        img.src = file;
        smartcrop.crop(img, options, function(result){
          var canvas = new Canvas(options.width, options.height)
            , context = canvas.getContext('2d')
            , crop = result.topCrop;
          context.patternQuality = 'best';
          context.filter = 'best';
          context.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
          utils.streamToUnemptyBuffer(canvas.syncJPEGStream({quality: 90}), function(err, data) {
            if (err) {
              ctx.set('Content-Type', 'application/json');
              ctx.throw(500, {success: false, msg: 'file error.'});
            } else {
              ctx.set('Content-Type', meta.mime);
              ctx.body = data;
            }
            deferred.resolve();
          });
        });
      }
    });
  });
  return deferred.promise;
};

function setCacheHeader(ctx, meta, file) {
  ctx.status = 200;
  ctx.set('Date', new Date().toUTCString());
  ctx.set('Last-Modified', meta.mtime);
  ctx.set('ETag', 'W/"' + crc32(file) + '"');
};
