var koa = require('koa')
  , route = require('koa-route')
  , logger = require('koa-logger')
  , serve = require('koa-static-folder')
  , views = require('co-views')
  , jade = require('jade')
  , admin = require('./admin')
  , images = require('./images')
  , upload = require('./images/upload');

var app = koa();

app.use(logger());
app.use(serve('./assets'));

var render = views(__dirname + '/views', {
  ext: 'jade'
});

app.use(function* (next) {
  this.render = render;
  this.jade = view => jade.renderFile(__dirname + '/views/' + view);
  yield next;
});

app.use(route.get('/', admin.index));
app.use(route.get('/install', admin.installPage));
app.use(route.post('/install', admin.install));

app.use(route.get('/images', images.all));

app.use(route.get('/image', function *() {
  this.body = yield this.render('upload');
}));
app.use(route.post('/image', upload));

app.use(route.get('/image/:id', images.get));
app.use(route.get('/image/:id/view', images.imageview));
app.use(route.get('/image/:id/smart', images.smart));

app.listen(process.env.PORT || 3000);
console.log('listening on port ' + (process.env.PORT || 3000));
