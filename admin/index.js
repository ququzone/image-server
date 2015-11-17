var _ = require('underscore')
  , parse = require('co-body')
  , jade = require('jade')
  , store = require('../store')
  , utils = require('../lib/utils');

exports.index = function *() {
  var ctx = this;
  yield () => {
    return new Promise((resolve, reject) => {
      store.getUser((err, user) => {
        if (err) {
          ctx.set('Content-Type', 'text/plain');
          ctx.status = 500;
          ctx.body = 'redis server error.';
        } else if (_.isEmpty(user)) {
          ctx.redirect('/install');
        } else {
          ctx.body = ctx.jade('index.jade');
        }
        resolve();
      });
    });
  }();
};

exports.installPage = function *() {
  this.body = this.jade('install.jade');
};

exports.install = function *() {
  var ctx = this;
  var body = yield parse(this);
  yield () => {
    return new Promise((resolve, reject) => {
      store.getUser((err, user) => {
        if (err) {
          ctx.set('Content-Type', 'text/plain');
          ctx.status = 500;
          ctx.body = 'redis server error.';
          return resolve();
        }
        if (!_.isEmpty(user)) {
          ctx.redirect('/');
          return resolve();
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
            return resolve();
          });
        } else {
          ctx.set('Content-Type', 'text/plain');
          ctx.status = 400;
          ctx.body = 'install request params error.';
          return resolve();
        }
      });
    });
  }();
};

exports.image = function *(id) {
  this.body = this.jade('image.jade', {id: id});
};
