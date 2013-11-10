var MediaWatcher = require('mediaWatcher').MediaWatcher,
    EventEmitter = require("events").EventEmitter;

MediaWatcher.prototype.__proto__ = EventEmitter.prototype;

MediaWatcher.prototype._respond = function (data){
  event = this.pollEvent();
  while(event){
    console.log(event)
    if(event.name === "serverAdded"){
      this.emit('serverAdded',event);
    }else if(event.name === "serverRemoved"){
      this.emit('serverRemoved',event);
    }else if(event.name === "rendererAdded"){
      this.emit('rendererAdded',event);
    }else if(event.name === "rendererRemoved"){
      this.emit('rendererRemoved',event);
    }else if(event.name === "ContainerUpdateIDs"){
      this.emit('containerUpdate',event);
    }else{
      this.emit('stateChange',event);
    }
    event = this.pollEvent();
  }
  this.watchEvents(this._respond.bind(this));
};
MediaWatcher.prototype.openAndPlay = function(trackItem,callback){

  var self = this;
  this.open(function(resO){
    console.log("Result of open",resO);
    self.play(function(resP){
      console.log("Result of play",resP);
      return callback({res: resP});
    });
  },trackItem);
};

MediaWatcher.prototype.setPosition = function(uuid,position){
  var hours = Math.floor(position / 3600000),
      minutes,
      seconds,
      target;

  position -= hours * 3600000;
  minutes = Math.floor(position / 60000);
  position -= minutes * 60000;
  seconds = Math.floor(position / 1000);

  hours = (hours < 10) ? "0"+hours : hours;
  minutes = (minutes < 10) ? "0"+minutes : minutes;
  seconds = (seconds < 10) ? "0"+seconds : seconds;

  target = hours + ":" + minutes + ":" + seconds;
  this.setRenderer(this.uuid);
  this.seek(function(){},target);
}

MediaWatcher.prototype.getTrackPosition = function(uuid){
  var self = this;
  this.setRenderer(uuid);
  this.getPosition(function(result){
    result.uuid = uuid;
    self.emit("gotPosition",result);
  })
}

MediaWatcher.prototype.listen = function(){
  this.startUpnp(function(){});
  this.watchEvents(this._respond.bind(this));
}



var mw = new MediaWatcher();
EventEmitter.call(mw);

module.exports = mw;