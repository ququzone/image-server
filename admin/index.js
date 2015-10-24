var Q = require('q')
  , _ = require('underscore')
  , jade = require('jade')
  , store = require('../store');

exports.index = function *() {
  yield function(ctx) {
    var deferred = Q.defer();
    store.getUser((err, user) => {
      if (err) {
        ctx.set('Content-Type', 'text/plain');
        ctx.throw(500, 'redis server error');
      } else if (_.isEmpty(user)) {
        ctx.body = ctx.jade('install.jade');
      } else {
        ctx.redirect('/');
      }
      deferred.resolve();
    });
    return deferred.promise;
  }(this);
};
