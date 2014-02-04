var rask = require('rask');

require('./watcher').startWatcher()
  .on('error', function(err) {
      log.error('watcher error:', err);
    });

require('./http').startHttpServer();
