var co = require('co');
var thunkify = require('thunkify');
var net = require('net');
var os = require('os');
var HackerChat = require('./hacker-chat');
var spawn = require('child_process').spawn;


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

var MSGS = {
  displayData: function(){
    return {
      app: 'icu-ucme',
      type: 'displayData',
      data: {
        name: os.hostname(),
        display: 0,
        host: getIP4address()
      }
    };
  },
  requestDisplayData: function(){
    return {
      app: 'icu-ucme',
      type: 'requstDisplay'
    };
  }
};

var queryDisplays = function(hackerChat){
  var displays = {};
  var logDisplays = function(message) {
    if(message && message.type =='displayData') {
      var data = message.data;
      displays[data.host + ":" + data.display] = data;
    }
  };

  return function(cb){
    hackerChat.on('data', logDisplays);
    hackerChat.write(MSGS.requestDisplayData());
    setTimeout(function(){
      hackerChat.removeListener('data', logDisplays);

      // get the array of values
      var displayData = Object.keys(displays).map(function (key) {
        return displays[key];
      });

      cb(null, displayData);
    }, 300);
  };
};

// choose the first display
// it would be nice to ask about multiple displays
var chooseDisplay = function(displays){
  return function(cb){
    cb(null, displays[0]);
  };
};

var launchVnc = function(display) {
  if (os.platform()=== 'darwin') {
    var vncUrl = 'vnc://' + display.host + ':' + display.display;
    spawn('open', [vncUrl], {
      detached: true,
      stdio: 'ignore'
    });
    return;
  }
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
  hackerChat.write(MSGS.displayData());
  console.log("Broadcasting: ", MSGS.displayData().data);

  // Listen for "any body broadcasting?" messages and respond
  hackerChat.on('data', function(data){
    if (data.type === 'requstDisplay') {
      hackerChat.write(MSGS.displayData());
      console.log("sending display data upon request");
    }
  });

  // process.exit(0);
});

var icu = co(function*(){
  var hackerChat = new HackerChat('icu-ucme');
  // wait 300ms for ucme's to respond
  var displays = yield queryDisplays(hackerChat);
  if (displays.length === 0) {
    console.log("No displays detected on localnetwork");
    process.exit(1);
  }

  var display = yield chooseDisplay(displays);

  console.log("launching", display);
  launchVnc(display);

  hackerChat.end();
});

module.exports = {
  ucme: ucme,
  icu: icu
};