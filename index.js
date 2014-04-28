var http = require('http')
  , connect = require('connect')
  , config = require('./config')
  , image = require('./image');

var app = connect()
  .use(connect.query())
  .use(image(config.resources.prefix, config.resources.root))
  .use(function(req, res) {
    res.end('hello, image server.')
  });

http.createServer(app).listen(3000);