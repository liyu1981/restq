var util = require('util');
var amqplib = require('amqplib');
var _ = require('underscore');

var log = require('./log').get(module);

function Watcher() {
  this.reset();
};
util.inherits(Watcher, require('events').EventEmitter);

Watcher.prototype.reset = function() {
  this._conn = null;
  this._ch = null;
};

Watcher.prototype.getCh = function(callback) {
  var self = this;
  if (this._ch === null) {
    var connStr = 'amqp://localhost?heartbeat=10';
    log.info('will connect to:', connStr);
    amqplib.connect(connStr).then(function(conn) {
        self._conn = conn.on('error', function(error) {
            log.error('got error: ', error);
          }).on('close', function() {
            log.info('connection closed.');
            self.reset();
          });
        log.info('connected. Now create channel...');
        self._conn.createChannel().then(function(ch) {
            self._ch = ch;
            log.info('created.');
            callback(null, self._ch);
          }, callback);
      }, callback);
  } else {
    callback(null, this._ch);
  }
};

var w = new Watcher();

exports.watch = function(q, callback) {
  q = q || 'tasks';
  w.getCh(function(err, ch) {
      if (err) {
        callback && callback(err);
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
        }, callback);
    });
};
