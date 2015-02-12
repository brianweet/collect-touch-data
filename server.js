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
	    tableSvc.createTableIfNotExists('highscore', function(error, result, response){
		    if(error){
		    	console.error('Cannot create highscore table', error);
		    	process.exit(1);
		    }

		    // Table exists or created
			started = true;
			app.listen(process.env.PORT || 1337);
			console.log('Listening at', process.env.PORT || 1337);
		});
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
		  userAgent: entGen.String(req.body.userAgent),
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

			res.send('OK');
		});
	});
});

app.post('/api/nickname/:sessionid', function(req, res, next){
	var query = new azure.TableQuery().where('PartitionKey eq ?', req.params.sessionid);
	tableSvc.queryEntities('sentence',query, null, function(error, result, response) {
		if(!req.body || !req.body.nickname){
			console.error('Need nickname info in body');
			return next('Need nickname info in body');
		}

		if(error){
			console.error('Loading failed', error, req.body);
			return next(error);
		}  
		var totalChars = 0,
			totalTime = 0,
			totalWrongChars = 0;

		var resultLength = result.entries.length;
		for (var i = 0; i < resultLength; i++) {
			var sentenceResult = JSON.parse(result.entries[i].data._);
			totalWrongChars += sentenceResult.wrongCharCount;
			totalChars += sentenceResult.sentence.s.length;
			totalTime += sentenceResult.data[sentenceResult.data.length-1].time;
		}

		//for now, just replace 'weird' characters. want to use name as partkey so..		
		var partKey = req.body.nickname.replace(/[^a-z0-9]/gi, '-');

		var task = {
		  PartitionKey: entGen.String(partKey),
		  RowKey: entGen.String(req.params.sessionid),
		  nickname: 		entGen.String(req.body.nickname),
		  correctChars: 	entGen.Int32(totalChars - totalWrongChars),
		  chars: 			entGen.Int32(totalChars),
		  wrongChars: 		entGen.Int32(totalWrongChars),
		  error: 			entGen.Double(totalWrongChars * 100 / totalChars),
		  charPerMinute:    entGen.Double(60000 / totalTime * (totalChars - totalWrongChars)),
		  totalTime: 		entGen.Int32(totalTime)
		};

		tableSvc.insertEntity('highscore', task, function (error, result, response) {
			if(error)
				throw error;

			console.log('highscore');
			res.send('OK');
		});
	});
});

app.get('/api/highscore', function(req, res, next){
	var query = new azure.TableQuery();
	tableSvc.queryEntities('highscore',query, null, function(error, result, response) {
		if(error){
			console.error('Loading failed', error, req.body);
			return next(error);
		} 

		var tempResults = [];
		var resultLength = result.entries.length;
		for (var i = 0; i < resultLength; i++) {
			var highscore = toObject(result.entries[i]);
			if(!highscore.score)
				highscore.score = highscore.correctChars - highscore.wrongChars + highscore.charPerMinute;

			tempResults.push(highscore);
		}

		tempResults.sort(sortHighscore);
		tempResults = tempResults.slice(0, 20);
		tempResults = tempResults.map(function(r) { 
			return {
				nickname: r.nickname,
				correctChars: r.correctChars,
				chars: r.chars,
				wrongChars: r.wrongChars,
				error: r.error.toFixed(1),
				charPerMinute: r.charPerMinute.toFixed(0),
				totalTime: r.totalTime,
				score: r.score.toFixed(0)
			}; 
		});

		//TODO: perhaps cache highscore
		res.send(tempResults);
	});
});

// app.get('/api/highscore/all', function(req, res, next){
// 	var query = new azure.TableQuery();
// 	tableSvc.queryEntities('highscore',query, null, function(error, result, response) {
// 		if(error){
// 			console.error('Loading failed', error, req.body);
// 			return next(error);
// 		} 

// 		res.send(result);
// 	});
// });

// app.get('/api/del/:pkey/:rkey', function(req, res, next){
// 	var task = { 
// 	  PartitionKey: {'_':req.params.pkey},
// 	  RowKey: {'_': req.params.rkey}
// 	};

// 	tableSvc.deleteEntity('highscore', task, function(error, response){
// 	  if(!error) {
// 	  	console.error('Loading failed', error, req.params);
// 	  	return next(error);
// 	  }
// 	  res.send('OK');
// 	});
// });

function sortHighscore(a, b) {
	if(a.score > b.score)
		return -1;
	else if(a.score < b.score)
		return 1;

	return 0;
}

function toObject(azureObject){
	var o = {};
	for (var prop in azureObject) {
		if(prop === 'jsonData')
			o[prop] = JSON.parse(azureObject[prop]._);
		else
			o[prop] = azureObject[prop]._;
	}
	return o;
}





















