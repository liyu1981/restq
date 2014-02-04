var util = require('util');
var log = require('rask').log.get(module);

function AmqpCli(uri) {
  var AmqpConn = require('./amqp').AmqpConn;
  this._ac = new AmqpConn(uri || 'amqp://localhost?heartbeat=10');
}
util.inherits(AmqpCli, require('events').EventEmitter);

AmqpCli.prototype.send = function(q, data) {
  var qname = (typeof q === 'string') ? q : q.name;
  var self = this;
  this._ac.getConn(function(err, conn) {
      if (err) {
        self.emit('error', err);
        return;
      }
      conn.createChannel().then(function(ch) {
          console.log('channel opened.');
          return ch.assertQueue(qname).then(function(_qok) {
            console.log('qok, will send data: ', data);
            var d = (typeof data === 'string') ? data : JSON.stringify(data);
            ch.sendToQueue(qname, new Buffer(d));
            console.log('sent.');
            self.emit('sent');
            return ch.close();
          });
        }, function(err) {
          self.emit('error', err);
        });
    });
  return this;
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
        c.on('error', function(err) {
            console.log(err);
          })
         .on('sent', function() {
            c.close();
          });
        c.send(process.argv[2], params);
      });
}
