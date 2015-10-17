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

app.use(route.get('/image/:id', images.get));
app.use(route.get('/image/:id/view', images.imageview));

app.use(route.get('/image', function *() {
  this.body = '<form method="post" enctype="multipart/form-data" action="/image">'
    + '<p>Image: <input type="file" name="image" /></p>'
    + '<p><input type="submit" value="Upload" /></p>'
    + '</form>';
}));

app.use(route.post('/image', upload));

app.listen(process.env.PORT || 3000);
console.log('listening on port ' + (process.env.PORT || 3000));
