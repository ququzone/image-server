var Q = require('q')
  , _ = require('underscore')
  , parse = require('co-body')
  , jade = require('jade')
  , store = require('../store')
  , utils = require('../lib/utils');

exports.index = function *() {
  yield function(ctx) {
    var deferred = Q.defer();
    store.getUser((err, user) => {
      if (err) {
        ctx.set('Content-Type', 'text/plain');
        ctx.status = 500;
        ctx.body = 'redis server error.';
      } else if (_.isEmpty(user)) {
        ctx.body = ctx.jade('install.jade');
      } else {
        ctx.body = ctx.jade('index.jade');
      }
      deferred.resolve();
    });
    return deferred.promise;
  }(this);
};

exports.install = function *() {
  var body = yield parse(this);
  yield function(ctx, body) {
    var deferred = Q.defer();
    store.getUser((err, user) => {
      if (err) {
        ctx.set('Content-Type', 'text/plain');
        ctx.status = 500;
        ctx.body = 'redis server error.';
        return deferred.resolve();
      }
      if (!_.isEmpty(user)) {
        ctx.redirect('/');
        return deferred.resolve();
      }
      if (body && body.username && body.password) {
        body.password = utils.passwordHash(body.password);
        body = _.pick(body, 'username', 'password');
        store.addUser(body, err => {
          if (err) {
            ctx.set('Content-Type', 'text/plain');
            ctx.status = 500;
            ctx.body = 'redis server error.';
          }
          ctx.redirect('/');
          return deferred.resolve();
        });
      } else {
        ctx.set('Content-Type', 'text/plain');
        ctx.status = 400;
        ctx.body = 'install request params error.';
        deferred.resolve();
        return;
      }
    });
    return deferred.promise;
  }(this, body);
};
