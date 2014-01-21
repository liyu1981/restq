var util = require('util');

var log = require('./log').get(module);

function AmqpCli(uri) {
  this._connUri = uri || 'amqp://localhost?heartbeat=10';
  this.reset();
}
util.inherits(AmqpCli, require('events').EventEmitter);

AmqpCli.prototype.reset = function() {
  this._conn = null;
};

AmqpCli.prototype.getConn = function(callback) {
  var self = this;
  if (this._conn === null) {
    require('amqplib').connect(this._connUri).then(function(conn) {
        self._conn = conn.on('error', function(error) {
            log.error('got error: ', error);
          }).on('close', function() {
            log.info('connection closed.');
            self.reset();
          });
        log.info('connected.');
        callback(null, self._conn);
      }, callback);
  } else {
    callback(null, this._conn);
  }
};

AmqpCli.prototype.send = function(q, data, callback) {
  var qname = (typeof q === 'string') ? q : q.name;
  this.getConn(function(err, conn) {
      if (err) {
        callback(err, null);
        return;
      }
      conn.createChannel().then(function(ch) {
          console.log('channel opened.');
          return ch.assertQueue(qname).then(function(_qok) {
            console.log('qok, will send data: ', data);
            var d = (typeof data === 'string') ? data : JSON.stringify(data);
            ch.sendToQueue(qname, new Buffer(d));
            console.log('sent.');
            callback(null);
            return ch.close();
          });
        }, callback);
    });
};

AmqpCli.prototype.close = function() {
  if (this._conn) {
    this._conn.close();
  }
};

exports = AmqpCli;

if (typeof module !== 'undefined' && require.main === module) {
  if (process.argv.length < 3) {
    console.log('Usage: node <this_script> queue_url');
    process.exit(1);
    return;
  }

  var rl = require('readline').createInterface(process.stdin, process.stdout);
  rl.setPrompt('Parameters for ' + process.argv[2] + ' (Ctrl-D to Finish)> \n');
  rl.prompt();
  var paramsLine = '';
  rl.on('line', function(line) {
        paramsLine += line.trim();
      })
    .on('close', function() {
        console.log('got your data:', paramsLine);
        var params = JSON.parse(paramsLine === '' ? '{}' : paramsLine);
        console.log('bye, get down to business :)');
        var c = new AmqpCli();
        c.send(process.argv[2], params,
          function(err) {
            if (err) {
              console.log('error:', err);
              return;
            }
            console.log('done.');
            //c.close();
          });
      });
}
