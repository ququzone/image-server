var express = require('express')
  , multiparty = require('multiparty')
  , config = require('./config')
  , images = require('./images')
  , upload = require('./images/upload');

var app = express();

app.get('/', function(req, res) {
  res.end('hello, image server.');
});

app.get(config.image.prefix + '/:id', images.get);

app.get(config.image.prefix + '/:id/imageview', images.imageview);

app.get(config.image.prefix, function(res, res) {
  res.send('<form method="post" enctype="multipart/form-data">'
  + '<p>Image: <input type="file" name="image" /></p>'
  + '<p><input type="submit" value="Upload" /></p>'
  + '</form>');
});

app.post(config.image.prefix, upload);

var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});
