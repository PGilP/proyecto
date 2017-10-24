var server = require('./src/server.js'),
    router = require('./src/router.js'),
    requestHandlers = require('./src/requestHandlers.js');

var handle = {  
  '/': requestHandlers.getIndex,
  '/contact': requestHandlers.getContact
}

server.startServer(router.route, handle);