var db = require('mongojs').connect('test', ['tracks','playlist']),
    mediaWatcher = require('./media_watcher'),
    mw = new mediaWatcher.MediaWatcher();


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

var respond = function (data){
  event = mw.pollEvent();
  while(event){
    if(event.name === "msAdd") {
      var server = mw.getServer();
      mw.getTracks(onTracksAdded,server);
      console.log("serverAdded");
    }else if(event.name === "mrAdd"){
      console.log("got renderer");
    }
    event = mw.pollEvent();
  }
  mw.watchEvents(respond);
};

var nowPlaying = {
  position: 0,
  set playlist(id){
    this._playlist = {list_id:new db.bson.ObjectID(id)};
  },
  _getTrack: function(position,categories,cb){
    var getProperties = {};
    if(typeof(categories) == 'function'){
      cb = categories;
      categories = {}
    }
    db.playlist.find(this._playlist,{}).sort(this.sort).skip(position).limit(1,function(err,data){
        console.log(data);
        if(data && data[0]){
          db.tracks.find({oID:data[0].track_id},categories,function(err,data){
            cb(err,data)
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

var renderer = {
  init: function(){
    this.list = Object.create(nowPlaying);
    this.list.playlist = "50578bdddcc92e2d0d000002";//HACK for now playing;
  }
}

//renderer.init();
//db.tracks.remove();
//mw.startUpnp(function(){});
//mw.watchEvents(respond);