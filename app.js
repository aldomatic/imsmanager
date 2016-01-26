var moment = require('moment')
,	underscore = require('underscore')
,	express = require('express')
,   exphbs  = require('express-handlebars')
, 	request = require('request')
,	path = require('path')
, assert = require('assert')
, bodyParser = require('body-parser');

// Express
var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', '.hbs');
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// MongoDB
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var mongoURL = 'mongodb://localhost:27017/offersmanager';

// Insert Document
var insertDocument = function(data, db, collection, callback){
	collection.insert({title: data['title'], url: data['url']}, function(err, result) {
		if (!err){
			callback({id: result[0]._id, status: "success"});
		} else {
			db.close();
		}
	});
}
var insertDocumentWidthPrepop = function(data, db, collection, callback){
	collection.insert({title: data['title'], url: data['url'], canprepop: data['prepop'], fields: data['prepopfields']}, function(err, result) {
		if (!err){
			callback({id: result[0]._id, status: "success"});
		} else {
			db.close();
		}
	});
}
var insertDJrectDocument = function(data, db, collection, callback){
	collection.insert({target: data['target'], offer: data['offer']}, function(err, result) {
		if (!err){
			callback({id: result[0]._id, status: "success"});
		} else {
			db.close();
		}
	});
}

// Remove Document
var removeDocument = function(data, db, collection, callback) {
   collection.remove({_id: ObjectId(data['id'])}, function(err, results) {
		 if (!err){
			 callback({status: "success", "results": results});
		 } else {
			 db.close();
		 }
    });
}


// Home
app.get('/', function(req, res) {
	res.render('home');
});

/*
 [POST] - Add offer
 */
app.post('/add/:type/:title/:url', function(req, res) {
	if(req.params.type == "apaoffer"){
		MongoClient.connect(mongoURL, function(err, db) {
			var collection = db.collection('apa_offers');
			insertDocument({"title": req.params.title, "url": req.params.url}, db, collection, function(result){
				res.json(result);
				db.close();
			});
		});
	} else if(req.params.type == "continueoffer") {
		MongoClient.connect(mongoURL, function(err, db) {
			var collection = db.collection('continue_offers');
			insertDocument({"title": req.params.title, "url": req.params.url}, db, collection, function(result){
				res.json(result);
				db.close();
			});
		});
	}
});

/*
 [POST] - Add reject offer (drugjustice.com)
*/
app.post('/addreject/:type/:target/:offer', function(req, res) {
	if(req.params.type == "drugjusticerejectoffer"){
		MongoClient.connect(mongoURL, function(err, db) {
			var collection = db.collection('djreject_offers');
			insertDJrectDocument({"target": req.params.target, "offer": req.params.offer}, db, collection, function(result){
				res.json(result);
				db.close();
			});
		});
	}
});


/*
 [POST] - Add offer with preopop ability
*/
app.post('/addofferwithprepop/:type/:title/:url/:fields', function(req, res) {
	if(req.params.type == "apaoffer"){
		MongoClient.connect(mongoURL, function(err, db) {
			var collection = db.collection('apa_offers');
			insertDocumentWidthPrepop({"title": req.params.title, "url": req.params.url, "prepop": true, "prepopfields": req.params.fields}, db, collection, function(result){
				res.json(result);
				db.close();
			});
		});
	}
});


// [GET] Get All Offers
app.get('/all/:type', function(req, res){
	if(req.params.type == "apaoffer"){
		MongoClient.connect(mongoURL, function(err, db) {
			var collection = db.collection('apa_offers');
			collection.find().sort({'position':1}).toArray(function(err, docs){
				res.json(docs);
				db.close();
			});
		});
	} else if(req.params.type == "continueoffer") {
		MongoClient.connect(mongoURL, function(err, db) {
			var collection = db.collection('continue_offers');
			collection.find().toArray(function(err, docs){
				res.json(docs);
				db.close();
			});
		});
	} else if(req.params.type == "djrejectoffers"){
		MongoClient.connect(mongoURL, function(err, db) {
			var collection = db.collection('djreject_offers');
			collection.find().toArray(function(err, docs){
				res.json(docs);
				db.close();
			});
		});
	}
});

//db.apa_offers.find().sort({'position':1})

/* -----------------------------------------------------------------------------------------
	GET /find/:type:/target
-------------------------------------------------------------------------------------------- */
app.get('/find/:type/:target', function(req, res){
	if(req.params.type == "djrejectoffers"){
		MongoClient.connect(mongoURL, function(err, db) {
			var collection = db.collection('djreject_offers');
			collection.findOne({target: req.params.target}, function(err, docs){
				if(!err){
					res.jsonp(docs);
				}
				db.close();
			});
		});
	}
});


app.post('/delete/:type/:id', function(req, res){
		if(req.params.type == "apaoffer"){
				MongoClient.connect(mongoURL, function(err, db) {
				var collection = db.collection('apa_offers');
				removeDocument({"id": req.params.id}, db, collection, function(result){
					res.json(result);
					db.close();
				});
			});
		} else if(req.params.type == "continueoffer"){
			MongoClient.connect(mongoURL, function(err, db) {
			var collection = db.collection('continue_offers');
			removeDocument({"id": req.params.id}, db, collection, function(result){
				res.json(result);
				db.close();
			});
		});
	} else if(req.params.type == "djrejectoffers"){
		MongoClient.connect(mongoURL, function(err, db) {
		var collection = db.collection('djreject_offers');
		removeDocument({"id": req.params.id}, db, collection, function(result){
			res.json(result);
			db.close();
		});
	});
	}
});


/* --------------------------------------------------------------------------------------
	POST /update/:type:/target
-----------------------------------------------------------------------------------------*/
app.post('/update/:type', function(req, res){
	var jsonBody = req.body;
	
	if(req.params.type == "apaoffer"){
		MongoClient.connect(mongoURL, function(err, db) {
			var collection = db.collection('apa_offers');
			var responseStatus = []; 

			for(var i = 0; i < jsonBody.length; i++){
				collection.update({'_id': ObjectId(jsonBody[i].id)}, {$set: {'position': jsonBody[i].position}}, function(err, result, status){
					responseStatus.push(status.ok);
				});
				if (i == jsonBody.length){ db.close(); }
			}
			res.json({status: "success"});
		});
	}
});


app.listen(8888);
console.log("server started at port 9090");
