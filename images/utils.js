exports.streamToUnemptyBuffer = function(stream, callback) {
  var done = false;
  var buffers = [];

  stream.on('data', function (data) {
    buffers.push(data)
  });

  stream.on('end', function () {
    var result, err;
    if (done)
      return;

    done = true;
    result = Buffer.concat(buffers);
    buffers = null;
    if (result.length == 0) {
      err = new Error("Stream yields empty buffer");
      callback(err, null);
    } else {
      callback(null, result);
    }
  });

  stream.on('error', function (err) {
    done = true;
    buffers = null;
    callback(err);
  });
};
