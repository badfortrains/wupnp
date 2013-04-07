var mw = require('../mediaWatcher'),
    Playlist = require("./playlist").playlist,
    Tracks = require("./tracks"),
    socketIO = require('socket.io'),
    util = require("util"),
    EventEmitter = require("events").EventEmitter;


var rendy = function(name,uuid){
  var self = this;
  this.position = 1;
  this.uuid = uuid;
  this.name = name;
  this.state = {};
  this.playlist = new Playlist(name +" quickList",uuid,function(id){
    self.id = id;
    self.state.quickList = id;
    self.state.playlist = id;
  })
  setInterval(this._getPosition.bind(this),1000);
} 
rendy.prototype = {
  _getPosition: function(){
    if(this.state.TransportState != "PLAYING"){
      return;
    }else{
      mw.getPosition(function(result){
        if(result){
          this.setState({name:"trackPosition",value:result.position});
          this.setState({name:"duration",value:result.duration});
        }
      }.bind(this))
    }
  },
  _playNext: function(cb){
    self = this;
    mw.setRenderer(this.uuid);
    this.playlist.resourcesAt(this.position,function(err,doc){
      if(!err && doc){
        mw.openAndPlay(doc,function(err){
          typeof(cb) === 'function' && cb(err);
        });
      }else{
        self.position = 1;
        self.setState({name:"currentPlayingTrack",vale:{}});
      }     
    })
  },
  next: function(cb){
    this.position++;
    this._playTrack();
  },
  previous: function(cb){
    if(this.position === 1){
      cb("No previous track");
      return;
    }else{
      this.position--;
      this._playTrack();
    }
  },
  setPlaylist: function(id){
    this.playlist.id = id;
    this.position = 1;
    this.setState({name:"playlist",value:id});
  },
  playPlaylist: function(id){
    this.setPlaylist(id);
    this._playTrack();
  },
  setState: function(event){
    if(this.state[event.name] !== event.value){
      //TODO: make this not supper ugly / hacky
      if( this.isPlaying && (event.value === "NO_MEDIA_PRESENT" || event.value === "STOPPED") && this.state.TransportState !== "TRANSITIONING" && this.state.TransportState !== "STOPPED"){
        this.state[event.name] = event.value;
        this.next();
      }else{
        this.state[event.name] = event.value;
      }
      //HACK: emiting on renderer obj, not this
      renderer.emit("stateChange",event.uuid,event);
    }
    
    if(event.name === "CurrentTrackURI"){
      this._onTrackChange(event.value);
    }

  },
  _onTrackChange:function(uri){
    var self = this;
    Tracks.findByUri(uri,function(err,doc){
      if(!err && doc){
        self.state.currentPlayingTrack = doc;
        doc.position = self.position;
        //HACK: emiting on renderer obj, not this
        renderer.emit("stateChange",self.uuid,{
          name:"currentPlayingTrack",
          value:doc
        })
      }

    })
  },
  _playTrack:function(){
    var self = this;
    mw.setRenderer(this.uuid);
    if(!this.isPlaying){
      mw.stop(function(){
        self._playNext(function(){
          self.isPlaying = true;
        });
      })
    }else if(this.state.TransportState === "STOPPED" || this.state.TransportState === "NO_MEDIA_PRESENT"){
      self._playNext();
      this.isPlaying = true;
    }else{
      this.isPlaying = true;
      //HACK stop will go to next track, need to offset that
      this.position--;
      mw.stop(function(res){
      });
    }
  },
  playAt: function(position){
    this.position = position;
    this._playTrack();
  },
  pause:function(){
    mw.setRenderer(this.uuid);
    mw.pause(function(){});
  },
  play:function(){
    mw.setRenderer(this.uuid);
    mw.play(function(){});
  },
  getAttributes: function(){
    return this.state;
  },
  setPosition: function(position){
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
    mw.setRenderer(this.uuid);
    mw.seek(function(){},target);
  }
}

var Renderer = function(){
  this.renderers = {};
}
util.inherits(Renderer,EventEmitter);
Renderer.prototype.find = function(uuid){
  return this.renderers[uuid];
}
Renderer.prototype.all = function(){

  return mw.getRenderers();
}
Renderer.prototype.exists = function(id){
  if(!this.renderers[id]){
    return false;
  }else
    return true;
}
Renderer.prototype.add = function(event){
  var uuid = event.uuid,
      name = event.value;

  this.renderers[uuid] = new rendy(name,uuid)
  this.emit("rendererAdded",{name:name,uuid:uuid})
}
Renderer.prototype.remove = function(event){
  var uuid = event.uuid;

  if(!this.exists(uuid)){
    return;
  }
  this.emit("rendererRemoved",{name:this.renderers[uuid].name,uuid:uuid})
  delete this.renderers[uuid];
}
Renderer.prototype.stateChange = function(event){
  if(!this.exists(event.uuid)){
    return;
  }
  this.renderers[event.uuid].setState(event);     
}
Renderer.prototype.getOne = function(){
    return Object.keys(this.renderers)[0];
}

var renderer = new Renderer();
mw.on("rendererAdded",renderer.add.bind(renderer))
mw.on("rendererRemoved",renderer.remove.bind(renderer))
mw.on("stateChange",renderer.stateChange.bind(renderer))


module.exports = renderer;