var co = require('co');
var thunkify = require('thunkify');
var net = require('net');
var os = require('os');
var HackerChat = require('./hacker-chat');

// test if the ho responds with "RFB"
var checkVncServer = function (host, displayNum) {
  var port = displayNum + 5900;
  var buffer = "";
  var opt = {
    host: host,
    port: port
  };

  return function (cb) { 
    var detectHandshake = function(data){
      buffer = buffer + data.toString();
      if (buffer.length < 3){
        return;
      }
      if (buffer.substr(0,3) === "RFB"){
        cb(null, true);
      } else {
        cb(null, false);
      }
      socket.end();
      socket.destroy(); // who cares anymore
    };

    var socket = net.connect(opt, function(){
      socket.on('data', detectHandshake);
    });
    socket.on('error', function(){
      cb(null, false);
    });
  };
};

var getIP4address = function(){
  var interfaces = os.networkInterfaces();
  var notInternal = [];

  var validAddress = function(ip){
    if (!ip.internal && ip.family === 'IPv4'){
      notInternal.push(ip.address);
    }
  };

  for (var ifname in interfaces){
    interfaces[ifname].forEach(validAddress);
  }

  return notInternal[0];
};

var displayData = function(){
  return {
    app: 'icu-ucme',
    type: 'displayData',
    data: {
      name: os.hostname(),
      display: 0,
      host: getIP4address()
    }
  };
};

// Let people know you're ready to share your screen
var ucme = co(function*(){
  var hackerChat = new HackerChat('icu-ucme');
  var isVncServer = yield checkVncServer('localhost', 0);
  if (!isVncServer) {
    console.log("You're not running a vnc server");
    process.exit(1);
  }

  // Broadcast on hacker chat that you can connect to me at primary ip and display 0 and my hostname is "whatever"
  hackerChat.write(displayData());

  // Listen for "any body broadcasting?" messages and respond
  hackerChat.on('data', function(data){
    if (data.type === 'requstDisplay') {
      hackerChat.write(displayData());
      console.log("sending display data upon request");
    }
  });

  // process.exit(0);
});

var icu = co(function*(){
  // hackerChat.broadcast(requestDisplayData());
  yield 4;
});

module.exports = {
  ucme: ucme
};