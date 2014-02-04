var util = require('util');
var _ = require('underscore');

var log = require('rask').log.get(module);

function Watcher(connStr) {
  var AmqpConn = require('./amqp').AmqpConn;
  this._ac = new AmqpConn(connStr || 'amqp://localhost?heartbeat=10');
  this._ch = null;

  var self = this;
  this._ac.on('connClose', function() {
      self._ch = null;
    });
}
util.inherits(Watcher, require('events').EventEmitter);

Watcher.prototype.getCh = function(callback) {
  var self = this;
  if (this._ch === null) {
    this._ac.getConn(function(err, conn) {
        if (err) {
          callback(err, null);
          return;
        }
        log.info('Channel...');
        conn.createChannel().then(function(ch) {
            self._ch = ch;
            log.info('created.');
            callback(null, self._ch);
          }, callback);
      });
  } else {
    callback(null, this._ch);
  }
};

Watcher.prototype.watch = function(q) {
  q = q || 'restq.whitenoise';
  this.getCh(function(err, ch) {
      if (err) {
        this.emit('error', err);
        return;
      }
      var qname = (typeof q === 'string') ? q : q.name;
      var qoption = (typeof q === 'string') ? {} : _.omit(q, 'name');
      log.info('assert queue:', qname);
      ch.assertQueue(qname, qoption).then(function(qstatus) {
          log.info('queue confirmed:', qstatus);
          ch.consume(qname, function(msg) {
            if (msg !== null) {
              console.log(JSON.parse(msg.content.toString()));
              ch.ack(msg);
            }
          });
          log.info('started consuming...');
        }, function(err) {
          self.emit('error', err);
        });
    });
  return this;
};

exports.startWatcher = function(options) {
  options = options || {};
  var w = new Watcher(options.uri || null);
  return w.watch(options.q | null);
};
