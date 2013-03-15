var mw = require('../mediaWatcher')
    ,db = require('mongojs').connect('test', ['tracks','playlist'])
    ,util = require("util")
    ,EventEmitter = require("events").EventEmitter
    ,servers = {}
    ,KNOWN_PATHS ={ 
      "e91f16b6-f441-4de4-a65d-d1ed420c10e1"   : "0$2$2",         //ps3Media Server
      "7076436f-6e65-1063-8074-4ce6766160b7" : "1$268435466",   //Linkstation
      "bc4fab65-9f26-3687-bbfc-1fb761347c74" : "2"              //galaxy s2
    }


var updateFromObjID = function(){
  var map = function(){
    emit(this.Album,this.Artist);
  }
  var reduce = function(k,vals){
    return vals[0];
  }
  db.tracks.mapReduce(map,reduce,{out:{inline:1}},function(err,data){
    if(data && !err){
      data.forEach(function(album){
        db.tracks.find({Album:album._id,Artist:album.value},{_id:1,oID:1}).sort({oID:1}).toArray(function(err,data){
          if(err){
            console.log("error getting sorted albums")
            console.log(err);
          }else{
            data.forEach(function(entry,i){
              db.tracks.update({_id:entry._id},{$set:{TrackNumber:i+1}});
            });
          }
        });
      });
    }else{
      console.log(err);
      console.log("Error getting artists");
    }
  });
}

var onTracksAdded = function(data){
  //add to db;
  if(data !== 'fail'){
    db.tracks.save(data,{safe:true},function(err){
      if(err){     
        console.log("error inserting initial data");
        console.log(err);
        server_model.emit("error","Error inserting tracks "+err);
      }else{
        updateFromObjID();
        server_model.emit("tracksInserted");
        db.tracks.ensureIndex({Album:1});
        db.tracks.ensureIndex({Title:1});
        db.tracks.ensureIndex({Artist: 1,Album: 1, Title: 1},function(){
          console.log("tracks inserted");
        });
      }      
    });
  }
}

var MediaServer = function(addEvent){
  this.name = addEvent.value;
  this.uuid = addEvent.uuid;
  this.setPath(KNOWN_PATHS[event.uuid]);
}

MediaServer.prototype.setPath = function(path){
  if(path){
    this.path = path
    console.log("get tracks",this.uuid,path)
    mw.getTracks(onTracksAdded,this.uuid,path);
  }
}


var add = function(event){
  servers[event.uuid] = new MediaServer(event);
  server_model.emit("serverAdded",servers[event.uuid])
}

var remove = function(event){
  servers[event.uuid] && delete servers[event.uuid];
  server_model.emit("serverRemoved",event)
}

//register events
mw.on("serverAdded",add);

var Server = function(){};
util.inherits(Server,EventEmitter);
Server.prototype.find = function(uuid){
  return servers[uuid];
};
Server.prototype.all = function(){
  var serverObjs = [];
  for(var uuid in servers){
    serverObjs.push(servers[uuid]);
  }
  return serverObjs;
};
Server.prototype.browse = function(uuid,id,cb){
  mw.doBrowse(cb,uuid,id);
}

var server_model = new Server();

server_model.on('tracksInserted',function(){
  server_model.lastUpdated = Date.now();
})
module.exports = server_model;
