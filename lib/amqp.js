var util = require('util');

var log = require('rask').log.get(module);

function AmqpConn(uri) {
  this._connUri = uri || 'amqp://localhost?heartbeat=10';
  this._conn = null;
}
util.inherits(AmqpConn, require('events').EventEmitter);

AmqpConn.prototype.getConn = function(callback) {
  var self = this;
  if (this._conn === null) {
    log.info('will connnet to:', this._connUri);
    require('amqplib').connect(this._connUri).then(function(conn) {
        self._conn = conn.on('error', function(error) {
            log.error('got error: ', error);
          }).on('close', function() {
            log.info('connection closed.');
            self.emit('connClose');
            self._conn = null;
          });
        log.info('connected.');
        callback(null, self._conn);
      }, callback);
  } else {
    callback(null, this._conn);
  }
};

exports.AmqpConn = AmqpConn;
