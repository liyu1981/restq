var util = require('util');
var amqplib = require('amqplib');

var log = require('./log').get(module);

function Watcher() {
  this._conn = null;
};
util.inherits(Watcher, require('EventEmitter'));

Watcher.prototype.getConn = function(callback) {
  var self = this;
  if (this._conn === null) {
    var connStr = 'amqp://localhost?heartbeat=10';
    log.info('will connect to:', connStr);
    amqplib.connect(connStr)
      .then(function(conn) {
          self._conn = conn.on('error', function(error) {
              log.error('current _conn got error: ', error);
            }).on('close', function() {
              self._conn = null;
              //self.emit('connClose');
            });
          callback(null, self._conn);
        },
        function(err) {
          callback(err, null);
        });
  } else {
    callback(null, _conn);
  }
};

var w = new Watcher();

function watch(q, callback) {
  w.getConn(function(err, conn) {
      if (err) {
        callback(err, null);
        return;
      }
      var qname = (typeof q === 'string') ? q, q.name;
      conn.assertQueue(qname);
      conn.consume(qname, function(msg) {
        if (msg !== null) {
          console.log(msg.content.toString());
          conn.ack(msg);
        }
      });
    });
}
