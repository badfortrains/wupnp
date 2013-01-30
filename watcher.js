var db = require('mongojs').connect('test', ['tracks','playlist']),
    mediaWatcher = require('./media_watcher'),
    mw = new mediaWatcher.MediaWatcher(),
    models = require('./models.js'),
    Playlist = require("./models/playlist").playlist,
    socketIO;






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
    //console.log("watch play")
    //console.log(trackItem)
    //mw.stop(function(resS){
    //  console.log("resS")
    //  console.log(resS)
      mw.open(function(resO){
        console.log("resO")
        console.log(resO)
        mw.play(function(resP){
          console.log("resP")
          console.log(resP)
          return callback({res: resP});
        });
      },trackItem);
    //});
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
  })
} 
rendy.prototype = {
  _playNext: function(cb){
    self = this;
    console.log("TRY PLAY")
    mw.setRenderer(this.uuid);
    this.playlist.findAt(this.position,function(err,docs){
      console.log("GOT DOCS");
      console.log(docs);
      if(!err && docs[0]){
        watcherInterface.play(docs[0],function(err){
          typeof(cb) === 'function' && cb(err);
        });
        self.state.currentTrack = docs[0];
      }
      self.nextTrack = docs && docs[1];      
    })
  },
  next: function(cb){
    console.log("in next");
    /*
    if(!this.nextTrack){
      console.log("NO NEXT TRACK");
      typeof(cb) == 'function' && cb("No next track");
      return;
      
    }else{
      */
      this.position++;
      this.play();
    //}
  },
  previous: function(cb){
    if(this.position === 1){
      cb("No previous track");
      return;
    }else{
      this.position--;
      this.play();
    }
  },
  setPlaylist: function(id){
    this.playlist.id = id;
    this.position = 1;
  },
  setState: function(event){
    if(this.state[event.name] !== event.value){
      this.state[event.name] = event.value;
      socketIO.sockets.in(event.uuid).emit("stateChange",event);
      console.log("HERE ",this.isPlaying);
      console.log("HERE This=",this);
      if(event.value === "STOPPED" && this.isPlaying){
        this.next();
      }
    }
    
    if(event.name === "CurrentTrackURI"){
      this._onTrackChange(event.value);
    }

    //console.log("GMediaRender-1_0-000-000-002");
    //if(event.value === "PLAYING" && this.uuid != "GMediaRender-1_0-000-000-002"){
    //  mw.getMediaInfo(this._onTrackChange.bind(this));
    //}

  },
  _onTrackChange:function(uri){
    var self = this;
    console.log("GET INFO")
    db.tracks.findOne({'Resources.Uri':uri},function(err,doc){
      if(!err && doc){
        self.state.currentTrack = doc;
        socketIO.sockets.in(self.uuid).emit("stateChange",{name:"currentTrack",value:doc});
      }

    })
  },
  play:function(){
    var self = this;
    console.log("In play");
    if(!this.isPlaying){
      mw.stop(function(){
        self._playNext(function(){
          self.isPlaying = true;
        });
      })
    }else if(this.state.TransportState === "PAUSED_PLAYBACK"){
      mw.play(function(){});
    }else if(this.state.TransportState === "STOPPED" || this.state.TransportState === "NO_MEDIA_PRESENT"){
      console.log("STOPPED, now play");
      self._playNext();
      this.isPlaying = true;
    }else{
      console.log("playing,now stop");
      this.isPlaying = true;
      //HACK stop will go to next track, need to offset that
      this.position--;
      mw.stop(function(res){
        console.log("STOP REs",res)
      });
    }
  },
  pause:function(){
    mw.pause(function(){});
  },
  getAttributes: function(){
    return this.state;
  },
  doPlay:function(){
    mw.play(function(){});
  },
  doStop: function(){
    mw.stop(function(){});
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
  next:function(id){
    if(!this.exists(id)){
      this.logErr("next","media renderer no longer exists");
      return;
    }
    this.renderers[id].list.getNext(function(err,data,hasNext){
      if(data){
        console.log(data[0]);
        this.mw.play(data[0],function(result){
          socketIO.sockets.in(id).emit('playResult',{
            result: result,
            track: data[0]
          })
        });
        this.stateChange({name:"hasNext",value:hasNext});
      }else{
        this.logErr('next',"error finding next track");
      }
    }.bind(this))
  },
  stateChange:function(event){
    console.log("STATE CHANGE",event);
    console.log("EXISTS",this.exists(event.uuid));
    if(!this.exists(event.uuid)){
      return;
    }

    if(mw.setRenderer(event.uuid) == false)
      console.log("ERROR SETTING TO THIS RENDERER");

    this.renderers[event.uuid].setState(event);
      
  }
}

var render = new renderer(watcherInterface);
//var playing = new nowPlaying("50578bdddcc92e2d0d000002");
//
var test;

var respond = function (data){
  console.log("ATEMPT TO POLL");
  event = mw.pollEvent();
  console.log("POLLED AND EVENT =",event);
  while(event){
    if(event.name === "msAdd") {
      var server = mw.getServer();
      //mw.getTracks(onTracksAdded,server);
      console.log("serverAdded");
    }else if(event.name === "mrAdd"){
      console.log("RENDERER ADDED");
      mw.setRenderer(event.uuid)
      render.add(event.uuid,event.value);
    }else{
      render.stateChange(event);
    }
      
    event = mw.pollEvent();
  }
  mw.watchEvents(respond);
};

//db.tracks.remove();


exports.renderer = render;
exports.getRenderer = function(){
  return Object.keys(render.renderers)[0];
}
exports.doPoll = function(){
  var event = mw.pollEvent();
  console.log("POLLED AND EVENT =",event);
}
exports.doPlay = function(){
  var event = mw.play(function(){
    console.log("PLAYED");
  });
  
}
exports.doStop = function(){
  var event = mw.stop(function(){
    console.log("STOPPED");
  });
  
}
exports.doGetInfo = function(){
  var event = mw.getMediaInfo(function(uri){
    console.log("Get info",uri);
  });
  
}

exports.listen = function(io){
  mw.startUpnp(function(){});
  mw.watchEvents(respond);
  socketIO = io;
}