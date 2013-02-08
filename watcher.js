var db = require('mongojs').connect('test', ['tracks','playlist']),
    mediaWatcher = require('./media_watcher'),
    mw = new mediaWatcher.MediaWatcher(),
    Playlist = require("./models/playlist").playlist,
    socketIO;




var MEDIA_SERVERS ={ 
  "e91f16b6-f441-4de4-a65d-d1ed420c10e1" : "0$2$2",
  "7076436f-6e65-1063-8074-4ce6766160b7" : "1$268435466"
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

var watcherInterface = {
  play:function(trackItem,callback){
    mw.open(function(resO){
      mw.play(function(resP){
        return callback({res: resP});
      });
    },trackItem);
  },
  stop:function(cb){
    wm.stop(cb);
  }
};


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
        watcherInterface.play(docs[0],function(err){
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
      
      socketIO.sockets.in(event.uuid).emit("stateChange",event);
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
        socketIO.sockets.in(self.uuid).emit("stateChange",{name:"currentPlayingTrack",value:doc});
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


var onTracksAdded = function(data){
  //add to db;
  if(data !== 'fail'){
    db.tracks.save(data,{safe:true},function(err){
      if(err){
        console.log("error inserting initial data");
        console.log(err);
      }
      //updateFromObjID();
      db.tracks.ensureIndex({Artist: 1,Album: 1, Title: 1},function(){
        console.log("tracks inserted");
      });
      
    });

    
  }

}

var renderer = function(mw){
  this.renderers = {};
  this.mw = mw;
}
renderer.prototype = {
  logErr:function(fn,err){
    console.log(err + " from : "+fn);
  },
  getRenderer: function(uuid){
    return this.renderers[uuid];
  },
  getRenderers: function(){
    return mw.getRenderers();
  },
  exists:function(id){
    if(!this.renderers[id]){
      return false;
    }else
      return true;
  },
  add:function(uuid,name){
    console.log("adding " + uuid + " " + name);
    this.renderers[uuid] = new rendy(name,uuid)
    socketIO.sockets.emit("rendererAdded",{name:name,uuid:uuid});
  },
  remove:function(uuid){
    socketIO.sockets.emit("rendererRemoved",{name:this.renderers[uuid].name,uuid:uuid});
    delete this.renderers[uuid];
  },
  stateChange:function(event){
    if(!this.exists(event.uuid)){
      return;
    }

    this.renderers[event.uuid].setState(event);     
  }
}

var render = new renderer(watcherInterface);

var respond = function (data){
  event = mw.pollEvent();
  while(event){
    if(event.name === "msAdd") {
      var server = mw.getServer();
      var dirId = MEDIA_SERVERS[event.uuid];
      if(dirId)
        mw.getTracks(onTracksAdded,server,dirId);
      console.log("SERVER ADDED GETTING TRACKS,",event.uuid);
    }else if(event.name === "mrAdd"){
      mw.setRenderer(event.uuid)
      render.add(event.uuid,event.value);
    }else{
      render.stateChange(event);
    }
      
    event = mw.pollEvent();
  }
  mw.watchEvents(respond);
};

db.tracks.remove();
exports.browse = function(uuid,id,cb){
  mw.doBrowse(cb,uuid,id);
};

exports.renderer = render;
exports.getRenderer = function(){
  return Object.keys(render.renderers)[0];
}

exports.listen = function(io){
  mw.startUpnp(function(){});
  mw.watchEvents(respond);
  socketIO = io;
}