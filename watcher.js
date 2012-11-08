var db = require('mongojs').connect('test', ['tracks','playlist']),
    mediaWatcher = require('./media_watcher'),
    mw = new mediaWatcher.MediaWatcher(),
    models = require('./models.js'),
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

var nowPlaying = function(uuid,name){
  if(!this.NOW_PLAYING[uuid]){
    this.playlist = name + " Now Playing";
    this.NOW_PLAYING[uuid] = this;
  }
  return this.NOW_PLAYING[uuid];
}

nowPlaying.prototype = {
  NOW_PLAYING:{},
  position: 0,
  set playlist(name){
    models.lists.add(name,function(data){
      this._playlist = {list_id:data._id};
    })
  },
  _getTrack: function(position,categories,cb){
    var getProperties = {};
    if(typeof(categories) == 'function'){
      cb = categories;
      categories = {}
    }
    db.playlist.find(this._playlist,{}).sort(this.sort).skip(position).limit(2,function(err,data){
        console.log(data);
        if(data && data[0]){
          var hasNext = (typeof data[1] !== 'undefined');
          db.tracks.find({oID:data[0].track_id},categories,function(err,data){
            cb(err,data,hasNext);
          });
        }else
          cb(err,data);
    });
  },
  getNext: function(cb){
    this._getTrack(++this.position,cb);
  },
  getPrevious: function(cb){
    this._getTrack(--this.position,cb);
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
  exists:function(id){
    if(!this.renderers[id]){
      return false;
    }else
      return true;
  },
  add:function(id,name){
    console.log("adding " + id + " " + name);
    this.renderers[id] = {
      name:name,
      list: new nowPlaying(id,name)
    };
    console.log(this.renderers);
    console.log(this);
  },
  next:function(id){
    if(!this.exists(id)){
      this.logErr("next","media renderer no longer exists");
    }
    this.renderers[id].list.getNext(function(err,data,hasNext){
      if(data){
        console.log(data[0]);
        this.mw.play(data[0]);
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
      if(this.renderers[event.uuid][event.name] !== event.value){
        this.renderers[event.uuid][event.name] = event.value
        socketIO.sockets.in(event.uuid).emit("stateChange",event);
      }
    }
  }
}

var render = new renderer(watcherInterface);
//var playing = new nowPlaying("50578bdddcc92e2d0d000002");

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



exports.getRenderer = function(){
  return Object.keys(render.renderers)[0];
}

exports.listen = function(io){
  mw.startUpnp(function(){});
  mw.watchEvents(respond);
  socketIO = io;
}