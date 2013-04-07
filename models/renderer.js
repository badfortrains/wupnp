var mw = require('../mediaWatcher'),
    mwb = require('../mediaWatcherWeb').mwb,
    Playlist = require("./playlist").playlist,
    Tracks = require("./tracks"),
    socketIO = require('socket.io'),
    util = require("util"),
    EventEmitter = require("events").EventEmitter;


var rendy = function(name,uuid,type){
  var self = this;
  this.position = 1;
  this.uuid = uuid;
  this.name = name;
  this.state = {};
  this.mw = (type === "WebRenderer") ? mwb : mw;
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
      this.mw.getTrackPosition(this.uuid);
    }
  },
  _gotPosition: function(result){
    if(result){
      this.setState({name:"trackPosition",value:result.position});
      this.setState({name:"duration",value:result.duration});
    }    
  },
  _playNext: function(cb){
    self = this;
    this.mw.setRenderer(this.uuid);
    this.playlist.resourcesAt(this.position,function(err,doc){
      if(!err && doc){
        self.mw.openAndPlay(doc,function(err){
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
      renderer.emit("stateChange",this.uuid,event);
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
    this.mw.setRenderer(this.uuid);
    if(!this.isPlaying){
      this.mw.stop(function(){
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
      this.mw.stop(function(res){
      });
    }
  },
  playAt: function(position){
    this.position = position;
    this._playTrack();
  },
  pause:function(){
    this.mw.setRenderer(this.uuid);
    this.mw.pause(function(){});
  },
  play:function(){
    this.mw.setRenderer(this.uuid);
    this.mw.play(function(){});
  },
  getAttributes: function(){
    return this.state;
  },
  setPosition: function(position){
    this.mw.setPosition(this.uuid,position);
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
  return mw.getRenderers().concat(mwb.getRenderers());
}
Renderer.prototype.exists = function(id){
  if(!this.renderers[id]){
    return false;
  }else
    return true;
}
Renderer.prototype.add = function(event){
  var uuid = event.uuid,
      name = event.value
      type = event.rendererType;

  this.renderers[uuid] = new rendy(name,uuid,type)
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
Renderer.prototype.gotPosition = function(event){
  if(!this.exists(event.uuid)){
    return;
  }
  this.renderers[event.uuid]._gotPosition(event); 
}

Renderer.prototype.getOne = function(){
    return Object.keys(this.renderers)[0];
}

var renderer = new Renderer();
mw.on("rendererAdded",renderer.add.bind(renderer))
mw.on("rendererRemoved",renderer.remove.bind(renderer))
mw.on("stateChange",renderer.stateChange.bind(renderer))
mw.on("gotPosition",renderer.gotPosition.bind(renderer))

mwb.on("rendererAdded",renderer.add.bind(renderer))
mwb.on("rendererRemoved",renderer.remove.bind(renderer))
mwb.on("stateChange",renderer.stateChange.bind(renderer))
mwb.on("gotPosition",renderer.gotPosition.bind(renderer))


module.exports = renderer;