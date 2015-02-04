var express = require('express');
var bodyParser = require('body-parser');

var azure = require('azure-storage');
var retryOperations = new azure.ExponentialRetryPolicyFilter();
var tableSvc = azure.createTableService().withFilter(retryOperations);
var entGen = azure.TableUtilities.entityGenerator;

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

function getEntity(table, partitionKey, rowKey) {
	return new Promise(function(resolve, reject) {
		tableSvc.retrieveEntity(table, partitionKey, rowKey, function(error, result, response){
		  if(error){
		    reject(error);
		  } else {
		  	resolve(response);
		  }
		});
	}.bind(this));
}

var started = false;
tableSvc.createTableIfNotExists('session', function(error, result, response){
    if(error){
    	console.error('Cannot create session table', error);
    	process.exit(1);
    }

    // Table exists or created
    tableSvc.createTableIfNotExists('sentence', function(error, result, response){
	    if(error){
	    	console.error('Cannot create sentence table', error);
	    	process.exit(1);
	    }
        // Table exists or created
		started = true;
		app.listen(process.env.PORT || 1337);
		console.log('Listening at', process.env.PORT || 1337);
	});
});

//init express
var app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/gaia-keyboard-demo'));

//register new session
app.post('/api/register', function(req, res, next) {
	if (!req.body || !req.body.resizeArgs || !req.body.screenDimensions) {
    	return next('Need keyboard size info in body');
  	}

  	//random?
	var newSessionId = randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
	var task = {
		  PartitionKey: entGen.String(newSessionId),
		  RowKey: entGen.String('1'),
		  keys: entGen.String(JSON.stringify(req.body.resizeArgs)),
		  screenDimensions: entGen.String(JSON.stringify(req.body.screenDimensions))
		};

	tableSvc.insertEntity('session',task, function (error, result, response) {
		if (error) {
			console.error('Saving failed', error, req.body);
			return next(error);
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
  	var session;

	tableSvc.retrieveEntity('session',req.params.sessionid,'1', function(error, result, response){
		if(error){
			console.error('Saving failed', error, req.body);
			return next(error);
		} 

		var task = {
		  PartitionKey: entGen.String(req.params.sessionid),
		  RowKey: entGen.String(req.body.sentence.id),
		  data: entGen.String(JSON.stringify(req.body))
		};
		tableSvc.insertEntity('sentence', task, function (error, result, response) {
			if(error)
				throw error;

			console.log('newSentence');
		    console.log(req.body);

			res.send('OK!');
		});
	});
});

app.get('/api/test', function(req, res, next){
	var query = new azure.TableQuery();
	tableSvc.queryEntities('session',query, null, function(error, result, response) {
		if(error){
			console.error('Loading failed', error, req.body);
			return next(error);
		} 

		// query was successful
		res.send(result);
	});
});

app.get('/api/test2', function(req, res, next){
	var query = new azure.TableQuery();
	tableSvc.queryEntities('sentence',query, null, function(error, result, response) {
		if(error){
			console.error('Loading failed', error, req.body);
			return next(error);
		}  

		// query was successful
		res.send(result);
	});
});





















