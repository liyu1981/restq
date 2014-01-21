var log = require('./log').get(module);
log.info('start loading config files.');
var conf = require('./conf');
conf.configure();
log.info('all config files loaded.');
require('./watcher').watch();
require('./http').startHttpServer();
