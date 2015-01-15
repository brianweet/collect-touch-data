/*var http = require('http')
var port = process.env.PORT || 1337;
http.createServer(function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World\n');
}).listen(port);*/


var finalhandler = require('finalhandler')
var http = require('http')
var serveStatic = require('serve-static')

var port = process.env.PORT || 1337;

// Serve up public folder
var serve = serveStatic('public', {'index': ['index.html']})

// Create server
var server = http.createServer(function(req, res){
  var done = finalhandler(req, res)
  serve(req, res, done)
})

// Listen
server.listen(port)

//var express = require('express');
//var app = express();
//
//var oneDay = 86400000;
//
//app.use(express.compress());
//
//app.use(express.static(__dirname + '/public', { maxAge: oneDay }));
//
//app.listen(process.env.PORT || 3000);