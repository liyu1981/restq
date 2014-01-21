var log = require('./log').get(module);
log.info('start loading config files.');
var conf = require('./conf');
conf.configure();
log.info('all config files loaded.');

require('./watcher').startWatcher()
  .on('error', function(err) {
      log.error('watcher error:', err);
    });

require('./http').startHttpServer();
