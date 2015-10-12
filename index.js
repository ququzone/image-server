var express = require('express')
  , images = require('./images')
  , upload = require('./images/upload');

var app = express();

app.get('/', function (req, res) {
  res.end('hello, image server.');
});

app.get('/image/:id', images.get);

app.get('/image/:id/view', images.imageview);

app.get('/image', function (req, res) {
  res.send('<form method="post" enctype="multipart/form-data" action="/image">'
    + '<p>Image: <input type="file" name="image" /></p>'
    + '<p><input type="submit" value="Upload" /></p>'
    + '</form>');
});

app.post('/image', upload);

var server = app.listen(3000, function () {
  console.log('Listening on port %d', server.address().port);
});
