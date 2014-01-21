var log = require('./log').get(module);

exports.startHttpServer = function() {
  log.info('now running http server...');
  require('http')
    .createServer(function (req, res) {
      })
    .listen(8765);
};
