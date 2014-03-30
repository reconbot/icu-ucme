var dgram = require('dgram');
var JSONStream = require('JSONStream');
var util = require('util');
var stream = require('stream');
var Duplex = stream.Duplex;

var HackerChat = module.exports = function(app, opt){
  if (!(this instanceof HackerChat)) { return new HackerChat(app, opt); }
  opt = opt || {};
  opt.objectMode = true;
  Duplex.call(this, opt);
  this.app = app;
  this.setupEvents();
};

util.inherits(HackerChat, Duplex);

HackerChat.prototype.setupEvents = function(){
  var socket = this.socket = dgram.createSocket('udp4');
  var jsonStream = this.jsonStream = JSONStream.parse();

  jsonStream.on('data', function(data){
    if (data && data.app === this.app) {
      this.push(data);
    }
  }.bind(this));

  socket.bind(31337, function () {
    socket.setBroadcast(true); // We intend to broadcast
    socket.on('message', function(data){
      jsonStream.write(data);
    });
  });

  this.on('finish', function(){
    socket.close();
  });
};

HackerChat.prototype._read = function(size){
  // sockets aint streams and jsonStream aint a stream 2
};

HackerChat.prototype._write = function(data, encoding, cb){
  if (!Buffer.isBuffer(data)) {
    data = new Buffer(JSON.stringify(data));
  }
  this.socket.send(data, 0, data.length, 31337, '255.255.255.255', cb);
};
