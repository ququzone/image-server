exports.writeJSON = function(res, json) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(json));
}