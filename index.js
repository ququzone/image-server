var koa = require('koa')
  , route = require('koa-route')
  , logger = require('koa-logger')
  , views = require('co-views')
  , images = require('./images')
  , upload = require('./images/upload');

var app = koa();

app.use(logger());

var render = views(__dirname + '/views', {
  ext: 'jade'
});

app.use(function* (next) {
  this.render = render;
  yield next;
});

app.use(route.get('/', function *() {
  this.body = yield this.render('index');
}));

app.use(route.get('/image', function *() {
  this.body = yield this.render('upload');
}));
app.use(route.post('/image', upload));

app.use(route.get('/image/:id', images.get));
app.use(route.get('/image/:id/view', images.imageview));
app.use(route.get('/image/:id/smart', images.smart));

app.listen(process.env.PORT || 3000);
console.log('listening on port ' + (process.env.PORT || 3000));
