var MediaWatcher = require('./media_watcher').MediaWatcher,
    EventEmitter = require("events").EventEmitter;

MediaWatcher.prototype.__proto__ = EventEmitter.prototype;

MediaWatcher.prototype._respond = function (data){
  event = this.pollEvent();
  while(event){
    if(event.name === "serverAdded")
      this.emit('serverAdded',event);
    else if(event.name === "rendererAdded"){
      this.emit('rendererAdded',event);
    }else if(event.name === "rendererRemoved"){
      this.emit('rendererRemoved',event);
    }else{
      this.emit('stateChange',event);
    }
    event = this.pollEvent();
  }
  this.watchEvents(this._respond.bind(this));
};
MediaWatcher.prototype.openAndPlay = function(trackItem,callback){
  console.log(trackItem.Resources)
  trackItem.Resources = JSON.parse(trackItem.Resources);
  console.log(trackItem.Resources)
  var self = this;
  this.open(function(resO){
    console.log("Result of open",resO);
    self.play(function(resP){
      console.log("Result of play",resP);
      return callback({res: resP});
    });
  },trackItem);
}
MediaWatcher.prototype.listen = function(){
  this.startUpnp(function(){});
  this.watchEvents(this._respond.bind(this));
}

var mw = new MediaWatcher();
EventEmitter.call(mw);

module.exports = mw;