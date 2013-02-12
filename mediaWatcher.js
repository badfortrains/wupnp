var MediaWatcher = require('./media_watcher').MediaWatcher,
    EventEmitter = require("events").EventEmitter;

utils.inherits(MediaWatcher,EventEmitter);

MediaWatcher.prototype._respond = function (data){
  event = this.pollEvent();
  while(event){
    this.emit(event.name,event)
    event = this.pollEvent();
  }
  this.watchEvents(this._respond.bind(this));
};

MediaWatcher.prototype.listen = function(){
  this.startUpnp(function(){});
  this.watchEvents(this._respond);
}

var mw = new MediaWatcher();

module.exports = mw;