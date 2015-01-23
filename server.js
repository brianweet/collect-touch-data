var express = require('express');
var bodyParser = require("body-parser");
var app = express();
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

app.post('/api/register', function(req, res, next) {
	var newSessionId = Math.random().toString(32).substr(2, 8);
	console.log(req.body);
	console.log('newSessionId', newSessionId);
	res.send(newSessionId);
});

app.post('/api/sentence/:sessionid', function(req, res, next) {
	console.log('sessionid', req.params.name);
	console.log(req.body);
	res.send('OK');
});

app.listen(process.env.PORT || 1337);