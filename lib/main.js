var rask = require('rask');

require('./watcher').startWatcher()
  .on('error', function(err) {
      log.error('watcher error:', err);
    });

rask.server({
    serveStatic: false
  })
  .route(function(server) {
      require('./http').register(server);
    })
  .start();
