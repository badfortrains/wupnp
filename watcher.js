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
    console.log(trackItem)
    mw.stop(function(resS){
      console.log("resS")
      console.log(resS)
      mw.open(function(resO){
        console.log("resO")
        console.log(resO)
        mw.play(function(resP){
          console.log("resP")
          console.log(resP)
          return callback({res: resP});
        });
      },trackItem);
    });
  }
};


var rendy = function(name,uuid){
  var self = this;
  this.position = 1;
  this.uuid = uuid;
  this.state = {};
  this.playlist = new Playlist(name +" quickList",uuid,function(id){
    self.id = id;
    self.play();
  })
} 
rendy.prototype = {
  play: function(cb){
    self = this;
    console.log("TRY PLAY")
    mw.setRenderer(this.uuid);
    this.playlist.findAt(this.position,function(err,docs){
      console.log("GOT DOCS");
      console.log(docs);
      if(!err && docs[0]){
        watcherInterface.play(docs[0],function(err){
          if(!err)
            self.position++;
          typeof(cb) === 'function' && cb(err);
        });
        self.state.currentTrack = docs[0];
      }
      self.nextTrack = docs && docs[1];      
    })
  },
  next: function(cb){
    if(!this.nextTrack){
      typeof(cb) == 'function' && cb("No next track");
      return;
    }else{
      this.position++;
      this.play();
    }
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
      updateFromObjID();
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
    this.renderers[id] = new rendy(name,uuid)
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
    if(!this.exists(event.uuid)){
      return;
    }
    if(event.value === "PLAYING" || event.value === "PAUSED_PLAYBACK" || event.name === "Mute" || event.name === "Volume" || event.name === "hasNext"){
      if(this.renderers[event.uuid][state][event.name] !== event.value){
        this.renderers[event.uuid][state][event.name] = event.value
        socketIO.sockets.in(event.uuid).emit("stateChange",event);
      }
    }
  }
}

var render = new renderer(watcherInterface);
//var playing = new nowPlaying("50578bdddcc92e2d0d000002");
//
var test;

var respond = function (data){
  event = mw.pollEvent();
  while(event){
    if(event.name === "msAdd") {
      var server = mw.getServer();
      //mw.getTracks(onTracksAdded,server);
      console.log("serverAdded");
    }else if(event.name === "mrAdd"){
      console.log("RENDERER ADDED");
      mw.setRenderer(event.uuid)
      render.add(event.uuid,event.value);
    }else
      render.stateChange(event);
    event = mw.pollEvent();
  }
  mw.watchEvents(respond);
};

//db.tracks.remove();


exports.renderer = render;
exports.getRenderer = function(){
  return Object.keys(render.renderers)[0];
}

exports.listen = function(io){
  mw.startUpnp(function(){});
  mw.watchEvents(respond);
  socketIO = io;
}