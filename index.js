var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);
var fs = require('fs');
//var port = 3000;

io.on('connection', function(socket){
    console.log(' ID: ' + socket.id + ' connected from: ' + socket.request.connection.remoteAddress);

    socket.on('check highscore',function(data){
        rank = JSON.parse(fs.readFileSync("rank.json"));
        for(var i=1;i<6;i++){
            if(rank[i.toString()].score<data.score){
                for(var j=5;j>i;j--){
                    rank[j.toString()] = rank[(j-1).toString()];
                }
                rank[i.toString()] = {
                    "name":data.name,
                    "score":data.score
                };
                console.log('Rank '+i+' updated...\n'+data.name+' : '+data.score);
                fs.writeFileSync("rank.json",JSON.stringify(rank));
                break;
            }else if(rank[i.toString()].name == data.name){
                break;
            }
        }
        socket.emit('ranks',rank);
    });
    
    socket.on('get ranks',function(){
        socket.emit('ranks',JSON.parse(fs.readFileSync("rank.json")));
    });

    socket.on('reset ranks',function(){
        console.log('Ranks reset...');
        fs.writeFileSync("rank.json",JSON.stringify({"1":{"name":"Derp","score":0},"2":{"name":"Herp","score":0},"3":{"name":"Zerp","score":0},"4":{"name":"Kerp","score":0},"5":{"name":"Merp","score":0}}));
    });

    socket.emit('ranks',JSON.parse(fs.readFileSync("rank.json")));

    socket.emit('region',process.env.MODULUS_REGION);
});

http.listen(process.env.PORT || 3000, function(){ // port = process.env.PORT
    console.log('listening on port: '+ process.env.PORT);
    console.log('cloud directory: ' + process.env.CLOUD_DIR);
    try{
        console.log(JSON.parse(fs.readFileSync("rank.json")));
    }catch(err){
        console.log(err);
        fs.writeFileSync("rank.json",JSON.stringify({"1":{"name":"Derp","score":0},"2":{"name":"Herp","score":0},"3":{"name":"Zerp","score":0},"4":{"name":"Kerp","score":0},"5":{"name":"Merp","score":0}}));
    }
});