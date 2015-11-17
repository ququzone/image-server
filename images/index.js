var _ = require('underscore')
  , crc32 = require('buffer-crc32').unsigned
  , mime = require('../lib/mime')
  , utils = require('../lib/utils')
  , store = require('../store');

exports.all = function *() {
  var ctx = this;
  yield () => {
    return new Promise((resolve, reject) => {
      var page = ctx.query.page || 1;
      store.getAllPage(page, (err, data) => {
        if (err) {
          ctx.set('Content-Type', 'application/json');
          ctx.status = 500;
          ctx.body = {success: false, msg: 'redis server error.'};
          return resolve();
        }
        ctx.body = {success: true, images: data};
        return resolve();
      });
    });
  }();
};

exports.get = function *(id) {
  var ctx = this;
  yield () => {
    return new Promise((resolve, reject) => {
      store.getFileMeta(id, (err, meta) => {
        if (err) {
          ctx.set('Content-Type', 'application/json');
          ctx.status = 400;
          ctx.body = {success: false, msg: 'no file found.'};
          return resolve();
        }
        store.getFile(id, (err, file) => {
          if (err) {
            ctx.set('Content-Type', 'application/json');
            ctx.status = 500;
            ctx.body = {success: false, msg: 'file error.'};
          } else {
            setCacheHeader(ctx, meta, file);
            if (ctx.fresh) {
              ctx.status = 304;
            } else {
              ctx.set('Content-Type', meta.mime);
              ctx.body = file;
            }
          }
          return resolve();
        });
      });
    });
  }();
};

exports.imageview = function *(id) {
  var ctx = this;
  yield () => {
    return new Promise((resolve, reject) => {
      store.getFileMeta(id, (err, meta) => {
        if (err) {
          ctx.set('Content-Type', 'application/json');
          ctx.status = 404;
          ctx.body = {success: false, msg: 'no file found.'};
          return resolve();
        }
        if (_.isEmpty(ctx.query)) {
          ctx.set('Content-Type', 'application/json');
          ctx.status = 400;
          ctx.body = {success: false, msg: 'miss request params.'};
          return resolve();
        }
        var query = {};
        query.w = ctx.query.w || null;
        query.h = ctx.query.h || null;
        store.getFileCache(id, query, (err, data) => {
          if (err) {
            ctx.set('Content-Type', 'application/json');
            ctx.status = 404;
            ctx.body = {success: false, msg: 'no file found.'};
          } else {
            setCacheHeader(ctx, meta, data);
            if (ctx.fresh) {
              ctx.status = 304;
            } else {
              ctx.set('Content-Type', meta.mime);
              ctx.body = data;
            }
          }
          return resolve();
        });
      });
    });
  }();
};

exports.smart = function *(id) {
  var ctx = this;
  yield () => {
    return new Promise((resolve, reject) => {
      store.getFileMeta(id, function(err, meta) {
        if (err) {
          ctx.set('Content-Type', 'application/json');
          ctx.status = 404;
          ctx.body = {success: false, msg: 'no file found.'};
          return resolve();
        }
        var query = {};
        if (ctx.query.w && ctx.query.h) {
          query.w = ctx.query.w;
          query.h = ctx.query.h;
        } else if (ctx.query.w && !ctx.query.h) {
          query.w = ctx.query.w;
          query.h = ctx.query.w;
        } else if (ctx.query.h && !ctx.query.w) {
          query.w = ctx.query.h;
          query.h = ctx.query.h;
        } else {
          query.w = 300;
          query.h = 300;
        }
        store.getSmartFile(id, query, function(err, data) {
          if (err) {
            ctx.set('Content-Type', 'application/json');
            ctx.status = 404;
            ctx.body = {success: false, msg: 'no file found.'};
          } else {
            setCacheHeader(ctx, meta, data);
            if (ctx.fresh) {
              ctx.status = 304;
            } else {
              ctx.set('Content-Type', meta.mime);
              ctx.body = data;
            }
          }
          return resolve();
        });
      });
    });
  }();
};

function setCacheHeader(ctx, meta, file) {
  ctx.status = 200;
  ctx.set('Date', new Date().toUTCString());
  ctx.set('Last-Modified', meta.mtime);
  ctx.set('ETag', 'W/"' + crc32(file) + '"');
};
