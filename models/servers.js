var mw = require('../mediaWatcher')
    ,util = require("util")
    ,EventEmitter = require("events").EventEmitter
    ,servers = {}
    ,Tracks = require("./tracks")
    ,KNOWN_PATHS ={ 
      //"e91f16b6-f441-4de4-a65d-d1ed420c10e1"   : "0$3$2",         //ps3Media Server
      "7076436f-6e65-1063-8074-4ce6766160b7" : "1$268435466",   //Linkstation
      //"bc4fab65-9f26-3687-bbfc-1fb761347c74" : "2"              //galaxy s2
    };



var onTracksAdded = function(data){
  //add to db;
  if(data != 'fail'){
    console.log('Inserting tracks')
    console.log(this.uuid);

    Tracks.insert(data,this.uuid,function(){
      this.status = "inserted"
    }.bind(this));
  }else{
    console.log("Error getting tracks from server")
  }
}

var MediaServer = function(addEvent){
  this.name = addEvent.value;
  this.uuid = addEvent.uuid;
  this.iconUrl = addEvent.iconUrl;
  this.baseUrl = addEvent.baseUrl;

  this.setPath(KNOWN_PATHS[event.uuid]);
}

MediaServer.prototype.setPath = function(path){
  if(path){
    this.path = path
    console.log("get tracks",this.uuid,path)
    this.status = "loading"
    mw.getTracks(onTracksAdded.bind(this),this.uuid,path);
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

var tracksChange = function(event){
  var containers;
  server = servers[event.uuid];
  if(server){
    //only search updated album folders for new tracks
    //ignore 1$14$342123623 - container for all albums
    containers = event.value.split(",").filter(function(container){
      return(/1\$14\$.+/.test(container) && container != '1$14$342123623') && container != '1$14'
    });
    if(containers[0]){
      mw.getTracks(onTracksAdded.bind(server),server.uuid,containers[0]);
    }
  }
}

//register events
mw.on("serverAdded",add);
mw.on("containerUpdate",tracksChange)
mw.on("serverRemoved",function(event){
  Tracks.drop_by_uuid(event.uuid)
})

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
module.exports = server_model;
