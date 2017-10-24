const http   = require('http'),
      config = require('./config.js'),
      url    = require('url');

exports.startServer = function(route, handle){   
    var onRequest = function(req,res){
        var pathname = url.parse(req.url).pathname;
        var content = route(handle, pathname, res);
    }
    http.createServer(onRequest).listen(config.port);
}
