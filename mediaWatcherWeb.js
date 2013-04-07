var EventEmitter = require("events").EventEmitter,
    util = require("util");

var MediaWatcherWeb = function(){
  this.renderers = {};
  this.rendererId = 1;
};
util.inherits(MediaWatcherWeb,EventEmitter);

MediaWatcherWeb.prototype.testRenderer = function(uuid){
  if(!this.renderers){
    this.emit("rendererRemoved",uuid);
    return false
  }else{
    return true;
  }
};

MediaWatcherWeb.prototype.setRenderer = function(uuid){
  this.testRenderer(uuid) && (this.renderer = uuid);
};

["play","pause","stop"].forEach(function(method){
  MediaWatcherWeb.prototype[method] = function(cb){
    this.testRenderer(this.renderer) && this.renderers[this.renderer].emit(method);
    cb(true);
  }
})

MediaWatcherWeb.prototype.setPosition = function(uuid,position){
  this.testRenderer(uuid) && this.renderers[uuid].emit("seek",position);
};

MediaWatcherWeb.prototype.getTrackPosition = function(uuid,cb){
  this.testRenderer(uuid) && this.renderers[uuid].emit("getPosition");
};

MediaWatcherWeb.prototype.openAndPlay = function(track,cb){
  if(this.testRenderer(this.renderer) && track.Resources && track.Resources[0]){
    this.renderers[this.renderer].emit("openAndPlay",track.Resources[0].Uri);
    cb();
  }
};

MediaWatcherWeb.prototype.getRenderers = function(){
  var result = []
  for(var uuid in this.renderers){
    result.push({uuid:uuid,name:"WebRenderer"+uuid})
  }
  return result;
};

var mwb = new MediaWatcherWeb();
exports.mwb = mwb;
exports.onConnect = function(socket){
  var uuid = "web"+mwb.rendererId++;
  mwb.renderers[uuid] = socket;
  mwb.emit("rendererAdded",{uuid:uuid,value:"WebRenderer"+uuid,rendererType: "WebRenderer"});

  socket.on("positionResult",function(result){
    result.uuid = uuid;
    mwb.emit("gotPosition",result);
  })
  socket.on("stateChange",function(event){
    event.uuid = uuid;
    mwb.emit("stateChange",event);
  })

  socket.on("disconnect",function(){
    delete mwb.renderers[uuid];
    mwb.emit("rendererRemoved",{uuid:uuid,name:"WebRenderer"+uuid});
  })
};


