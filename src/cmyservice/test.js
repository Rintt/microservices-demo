var io = require('socket.io-client')
mysocket = io.connect('localhost:5001');
mysocket.on('connect', function(){
    mysocket.emit('_getProducts');
  });
  