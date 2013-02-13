var mw = require('../mediaWatcher'),
    db = require('mongojs').connect('test', ['tracks','playlist']),
    Playlist = require("./playlist").playlist,
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
} 
rendy.prototype = {
  _playNext: function(cb){
    console.log("in playNext")
    self = this;
    mw.setRenderer(this.uuid);
    this.playlist.findAt(this.position,function(err,docs){
      if(!err && docs[0]){
        mw.openAndPlay(docs[0],function(err){
          typeof(cb) === 'function' && cb(err);
        });
        self.state.currentPlayingTrack = docs[0];
      }else{
        self.setState({name:"currentPlayingTrack",vale:{}});
      }
      self.nextTrack = docs && docs[1];      
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
    db.tracks.findOne({'Resources.Uri':uri},function(err,doc){
      if(!err && doc){
        self.state.currentPlayingTrack = doc;
        //HACK: emiting on renderer obj, not this
        renderer.emit("stateChange",self.uuid,{
          name:"currentPlayingTrack",
          value:doc
        })
      }

    })
  },
  _playTrack:function(){
    console.log("in playtrack")
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
  playById: function(id){
    var self = this;
    this.playlist.getPosition(id,function(err,position){
      if(!err && position !== null && position !== undefined){
        self.position = position;
        self._playTrack();
      }
    })
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
  }
}

var Renderer = function(){
  this.renderers = {};
  this.secret = Math.random();
}
util.inherits(Renderer,EventEmitter);
Renderer.prototype.find = function(uuid){
  return this.renderers[uuid];
}
Renderer.prototype.all = function(){
  console.log("all from",this.secret)
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
  console.log("add",name,uuid);
  this.renderers[uuid] = new rendy(name,uuid)
  console.log(this);
  this.emit("rendererAdded",{name:name,uuid:uuid})
}
Renderer.prototype.remove = function(event){
  var uuid = event.uuid;
  console.log("remove",uuid)
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