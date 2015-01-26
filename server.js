var express = require('express');
var bodyParser = require('body-parser');
var nstore = require('nstore');

//init express
var app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

//init db
var inited = false;
var db = nstore.new('sessions.db', function(err) {
  if (inited) {
    return console.error('stupid db');
  }
  inited = true;
  if (err) {
    console.error('Cannot create sessions.db file', err);
    process.exit(1);
  }
  app.listen(process.env.PORT || 1337);
  console.log('Listening at', process.env.PORT || 1337);
});


//register new session
app.post('/api/register', function(req, res, next) {
	if (!req.body || !req.body.resizeArgs || !req.body.screenDimensions) {
    	return next('Need keyboard size info in body');
  	}

  	//random?
	var newSessionId = db.genKey();// Math.random().toString(32).substr(2, 8);

	var session = {
		version: 1,
		resizeArgs: req.body.resizeArgs,
		screenDimensions: req.body.screenDimensions,
		sentences: []
	};
	db.save(newSessionId, session, function(err) {
		if (err) {
			console.error('Saving failed', err, req.body);
			return next(err);
		}

		console.log(req.body);
		console.log('newSessionId', newSessionId);

		res.send(newSessionId);
    });
});

//save sentence typing data for session
app.post('/api/sentence/:sessionid', function(req, res, next) {
	if (!req.body) {
    	return next('Need sentence info in body');
  	}

	db.get(req.params.sessionid, function(err, session) {
  		if (err) {
  			return next(err);
    	}
    	else {
      		session.sentences.push(req.body);
      		session.version++;
    	}
	
	    console.log('saving', session);
	    db.save(req.params.sessionid, session, function(err) {
	      if (err) {
	        console.error('Saving failed', err, req.body);
	        return next(err);
	      }
	
	      res.send('OK!');
	    });
  	});
});