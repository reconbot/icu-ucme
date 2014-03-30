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
  this.setupRead();
};

util.inherits(HackerChat, Duplex);

HackerChat.prototype.setupRead = function(){
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
};

HackerChat.prototype._read = function(size){

};

HackerChat.prototype._write = function(data){
  if (!Buffer.isBuffer(data)) {
    data = new Buffer(JSON.stringify(data));
  }
  this.socket.send(data, 0, data.length, 31337, '255.255.255.255');
};
