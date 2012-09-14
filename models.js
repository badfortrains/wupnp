var db = require('mongojs').connect('test', ['tracks','playlist']),
    assert = require('assert');


function flatten(collection,property){
  var result = [];
  if(typeof(collection) === 'object'){
    collection.forEach(function(item){
      result.push(item[property]);
    });
  }
  return result;
}
exports.getList = function(id,category,filter,sort,cb){
  function search(){
    db.tracks.find(filter,category).sort(sort,function(err, docs){
      console.log(docs.length)
      if(err){ 
        console.log("err finding playlist"+err);
        return;
      }else{
        cb(docs);
      }
    }); 
  }
  var objectFilter = {};
  console.log(sort)
  if(id !== false){
    id = parseInt(id,10);
    db.playlist.find({list_id: id},{_id:0,track_id:1},function(err,ids){
      if(err){
        console.log("err = "+err);
        return;
      }
      filter["_id"] = {$in : flatten(ids,"track_id")};
      console.log(filter);
      search();
    })
  }else
    search();
}

exports.distinctList = function(id,category,filter,reverse,cb){
  function search(){
    db.tracks.distinct(category,filter,function(err, docs){
      if(err){ 
        console.log("err finding playlist"+err);
      }else if(!docs){
        return;
      }else{
        //reverse list if needed
        if(reverse){
          cb(docs.sort().reverse());
        }else
          cb(docs.sort());
      }
    })
  }
  if(id !== false){
    id = parseInt(id,10);
    db.playlist.find({list_id:id},{_id:0,track_id:1},function(err,ids){
      filter["_id"] = {$in : flatten(ids,"track_id")};
      search();
    })
  }else
    search();

}


var lastPosition = function(id,position,filter,cb){
  db.playlist.count({"list_id":id},function(err,count){
    if(err)
      console.log(err);
    else{
      cb(count);
    }
  })
}
var moveDown = function(id,count,position,cb){
  if(posititon < count){
      //move all tracks at or after position 1 down, to make room for our new tracks. 
      //db.tracks.update({playlist: {"$elemMatch": {_id: id, pos:{$gte: position}}}},{$inc : {"playlist.$.pos":distance}},false,true,function(err){
      db.playlist.update({list_id:id,pos: {$gte: position}},{$inc : {pos: count}},false,true,function(err){
        if(err){
          console.log(err)
          return;
        }
        cb();
      });
    }else{
      cb()
    }
}

var addTracks = function(id,position,filter,sort,cb){
  i = position;
  db.tracks.find(filter,{_id:1}).sort(sort,function(err,tracks){
    if(err){
      console.log(err);
      return;
    }
    tracks.forEach(function(item){
      db.playlist.save({track_id:item._id,pos:i++,list_id:id});
      cb();
    });
  });
}

var playlist = {
  add: function(id,position,filter,sort,cb){
    lastPosition(function(count){
      moveDown(id,count,position,function(){
        addTracks(id,position,filter,sort,cb);
      });
    });
  }
}


/***TODO:move somewhere else***/
var mediaWatcher = require('./media_watcher');
var mw = new mediaWatcher.MediaWatcher();

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
  }
  mw.watchEvents(respond);
};

//mw.startUpnp(function(){});
//mw.watchEvents(respond);

