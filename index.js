var app = require('express')();
var https = require('https');
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);
var fs = require('fs');
var mongodb = require('mongodb');

mongodb.MongoClient.connect(process.env.MONGODB_URI || "mongodb://glowies:1q4ogHrhg8I7@ds061206.mlab.com:61206/heroku_ls0g949q", function(err, db) {
    mdb = db;
    if (err) {
        console.log('Unable to connect to MongoDB', err);
    } else {
        console.log('Connection established to MongoDB');
        collection = db.collection('leaderboard');
        blacklistCol = db.collection('blacklist');
        collection.find({},{limit:5,sort:[["rank","asc"]]}).toArray(function(err,result){
            if(err){
                console.log('Error finding in collection', err);
            }else if(result.length){
                console.log(result);
            }else{
                console.log('No doc in collection');
            }
        });
        http.listen(process.env.PORT || 3000, function(){ // port = process.env.PORT
            console.log('listening on port: '+ process.env.PORT || 3000);
        });
    }
});

io.on('connection', function(socket){
    console.log(' ID: ' + socket.id + ' connected from: ' + socket.request.connection.remoteAddress);

    socket.on('check highscore',function(data){
        var includes = 0;
        blacklistCol.find({}).toArray(function(err,result1){
            if(err){
                console.log('Error finding in collection', err);
            }else if(result1.length){
                for(var k=0;k<result1.length;k++){
                    if(result1[k].name == data.name){
                        includes = 1;
                    }
                }
            }else{
                console.log('No doc in blacklist collection');
            }
        });

        if(includes){
            socket.emit('ranks',[{'name':'YOUR','score':-1,'rank':0},{'name':'ACCOUNT','score':-1,'rank':1},{'name':'HAS','score':-1,'rank':2},{'name':'BEEN','score':-1,'rank':3},{'name':'SUSPENDED','score':-1,'rank':4}]);
        }else{
            collection.update({name: data.name}, {name: data.name, score: data.score, id: 0});
        }

    });
    
    socket.on('get ranks',function(){
        collection.find({},{limit:5,sort:[["score","descending"]]}).toArray(function(err,result){
            if(err){
                console.log('Error finding in collection', err);
            }else if(result.length){
                socket.emit('ranks',result);
            }else{
                console.log('No doc in collection');
            }
        });
    });

    socket.on('reset ranks',function(){
        console.log('Ranks reset...');
        collection.remove({});
        collection.insert({name:"Derp",score:-1,id:"0"});
        collection.insert({name:"Herp",score:-2,id:"0"});
        collection.insert({name:"Gerp",score:-3,id:"0"});
        collection.insert({name:"Zerp",score:-4,id:"0"});
        collection.insert({name:"Berp",score:-5,id:"0"});
    });

    socket.on('remove rank',function(){
        collection.find({},{limit:5,sort:[["rank","asc"]]}).toArray(function(err,result) {
            if (err) {
                console.log('Error finding in collection', err);
            } else if (result.length) {
                rank = result;
                newRank = rank.slice(1, 5);
                newRank.push({'rank': 4, 'name': 'Derp', 'score': 0,'id':1327});
                collection.remove({});
                for (var i = 0; i < newRank.length; i++) {
                    newRank[i].rank--;
                    collection.insert(newRank[i]);
                }
                socket.emit('ranks', newRank);
            } else {
                console.log('No doc in collection');
            }
        });
    });

    socket.on('suspend',function(data){
        blacklistCol.insert({'name':data.name});
        console.log(data.name + " Has Been Suspended...");
    });

    socket.on('check user',function(data){
        var includes = 0;
        collection.find({},{limit:5,sort:[["rank","asc"]]}).toArray(function(err,result) {
            if (err) {
                console.log('Error finding in collection', err);
            } else if (result.length) {
                for(var i=0;i<result.length;i++){
                    if(result[i].name == data){
                        includes = 1;
                    }
                }
            } else {
                console.log('No doc in collection');
            }
        });
        blacklistCol.find({}).toArray(function(err,result) {
            if (err) {
                console.log('Error finding in collection', err);
            } else if (result.length) {
                for(var i=0;i<result.length;i++){
                    if(result[i].name == data){
                        includes = 1;
                    }
                }
            } else {
                console.log('No doc in collection');
            }
        });
        socket.emit('user return',!includes);
    });

    socket.on('blacklist',function(data){
        blacklistCol.find({}).toArray(function(err,result1){
            if(err){
                console.log('Error finding in collection', err);
            }else if(result1.length){
                var includes = 0;
                for(var k=0;k<result1.length;k++){
                    if(result1[k].name == data){
                        includes = 1;
                    }
                }

                socket.emit('blacklist',!includes);
            }else{
                console.log('No doc in blacklist collection');
            }
        });
    });

    socket.on('test id',function(data){
        var userid;
        var req = https.get({
            host: 'www.googleapis.com',
            path: '/oauth2/v1/tokeninfo?access_token=' + data
        }, function(res) {
            // Buffer the body entirely for processing as a whole.
            var bodyChunks = [];
            res.on('data', function(chunk) {
                // You can process streamed parts here...
                bodyChunks.push(chunk);
            }).on('end', function() {
                var body = Buffer.concat(bodyChunks);
                userid = body;
                console.log('Token Verification: ' + body);
                // ...and/or process the entire body here.
            })
        });

        req.on('error', function(e) {
            console.log('ERROR: ' + e.message);
        });
    });

    collection.find({},{limit:5,sort:[["score","descending"]]}).toArray(function(err,result){
        if(err){
            console.log('Error finding in collection', err);
        }else if(result.length){
            socket.emit('ranks',result);
        }else{
            console.log('No doc in collection');
        }
    });
});