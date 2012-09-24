var db = require('mongojs').connect('test', ['tracks','playlist']),
    mediaWatcher = require('./media_watcher'),
    mw = new mediaWatcher.MediaWatcher();


var onTracksAdded = function(data){
  //add to db;
  if(data !== 'fail'){
    db.tracks.save(data);
    db.tracks.ensureIndex({Artist: 1,Album: 1, Title: 1});
    console.log("tracks inserted");
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
    console.log(event);
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
    this.list.id = "50578bdddcc92e2d0d000002";//HACK for now playing;
  }
}

renderer.init();
renderer.list.getNext(function(err,data){
  console.log("after get Next");
  console.log(err);
  console.log(data);
})
//db.tracks.drop();
//mw.startUpnp(function(){});
//mw.watchEvents(respond);