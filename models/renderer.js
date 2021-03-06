var mw = require('../mediaWatcher'),
    mwb = require('../mediaWatcherWeb').mwb,
    Playlist = require("./playlist").Playlist,
    PlaylistEmitter =  require("./playlist").PlaylistEmitter
    Tracks = require("./tracks"),
    socketIO = require('socket.io'),
    util = require("util"),
    EventEmitter = require("events").EventEmitter;


var rendy = function(name,uuid,type){
  var self = this;
  this.position = 0;
  this.uuid = uuid;
  this.name = name;
  this.state = {};
  this.mw = (type === "WebRenderer") ? mwb : mw;
  this.playlist = new Playlist({
    name: name +" quickList",
    uuid: uuid,
    cb: function(id){
      self.id = id;
      self.state.quickList = id;
      self.state.playlist = id;
    }
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
        self.position = 0;
        self.setState({name:"currentPlayingTrack",vale:{}});
      }     
    })
  },
  setupNextTrack: function(){
    this.playlist.resourcesAt(this.position + 1,function(err,doc){
      if(!err && doc){
        this.queuedUri = doc.Resources.map(function(r){return r.Uri});//store list of possible next uris 
        this.mw.openNextTrack(doc)
      }
    }.bind(this))
  },
  next: function(cb){
    this.position++;
    this._playTrack();
  },
  previous: function(cb){
    if(this.position === 0){
      cb("No previous track");
      return;
    }else{
      this.position--;
      this._playTrack();
    }
  },
  setPlaylist: function(id){
    this.playlist.id = id;
    this.position = 0;
    this.setState({name:"playlist",value:id});
  },
  playPlaylist: function(id){
    this.setPlaylist(id);
    this._playTrack();
  },
  setState: function(event){
    if(this.state[event.name] !== event.value){
      this.state[event.name] = event.value;
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
        if(self.queuedUri && self.queuedUri.indexOf(uri) != -1){
          self.position++;
        }
        self.setupNextTrack();
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
    if(this.isPlaying && (this.state.TransportState === "STOPPED" || this.state.TransportState === "NO_MEDIA_PRESENT")){
      self._playNext();
      this.isPlaying = true;
    }else{
      this.mw.stop(function(){
        self._playNext(function(){
          self.isPlaying = true;
        });
      })
    }
  },
  //return a promise
  playListTrack: function(playlistTrackId,playlistId){
    return Playlist.prototype.getTrackPosition(playlistTrackId)
    .then(function(position){
      this.setPlaylist(playlistId)
      this.playAt(position)
    }.bind(this))
  },
  playAt: function(position){
    this.position = position;
    this._playTrack();
  },
  pause:function(){
    this.mw.setRenderer(this.uuid);
    this.mw.pause();
  },
  play:function(){
    this.mw.setRenderer(this.uuid);
    this.mw.play();
  },
  getAttributes: function(){
    return this.state;
  },
  volumeDown: function(){
    if(this.state.Volume && this.state.Volume > 0)
      this.setVolume(parseInt(this.state.Volume,10) - 1)
  },
  volumeUp: function(){
    if(this.state.Volume)
      this.setVolume(parseInt(this.state.Volume,10) + 1)
  },
  setVolume: function(volume){
    this.mw.setRenderer(this.uuid);
    this.mw.setVolume(volume)
  },
  setPosition: function(position){
    this.mw.setPosition(this.uuid,position);
  },
  quickListPosition: function(){
    return this.state.quickList == this.state.playlist ? this.position : 0
  }
}

var Renderer = function(){
  this.renderers = {};
  PlaylistEmitter.on('drop',this.checkNext.bind(this))
  PlaylistEmitter.on('add',this.checkNext.bind(this))
  PlaylistEmitter.on('remove',this.checkNext.bind(this))

}
util.inherits(Renderer,EventEmitter);
Renderer.prototype.find = function(uuid){
  return this.renderers[uuid];
}
Renderer.prototype.checkNext = function(listId){
  var renderers = this.all().map(function(r){
    return this.find(r.uuid)
  },this);

  renderers.forEach(function(r){
    if(r.playlist.id == listId)
      r.setupNextTrack();
  })
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
      name = event.name
      type = event.rendererType;

  this.renderers[uuid] = new rendy(name,uuid,type)
  this.emit("rendererAdded",{name:name,uuid:uuid})
}
Renderer.prototype.remove = function(event){
  var uuid = event.uuid,
      quickList;

  if(!this.exists(uuid)){
    return;
  }

  this.emit("rendererRemoved",{name:this.renderers[uuid].name,uuid:uuid})
  quickList = new Playlist({id: this.renderers[uuid].state.quickList})
  quickList.drop();
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