var db = require('mongojs').connect('test', ['tracks','playlist','lists']),
    assert = require('assert'),
    util = require("util"),
    EventEmitter = require("events").EventEmitter;

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



var Tracks = function(){}
util.inherits(Tracks,EventEmitter);
Tracks.prototype.insert = function(data){
  db.tracks.save(data,{safe:true},function(err){
    if(err){     
      console.log("error inserting initial data into db");
      console.log(err);
      this.emit("error","Error inserting tracks "+err);
    }else{
      updateFromObjID();
      this.lastUpdated = Date.now();
      this.emit("tracksInserted");
      db.tracks.ensureIndex({Album:1});
      db.tracks.ensureIndex({Title:1});
      db.tracks.ensureIndex({Artist: 1,Album: 1, Title: 1},function(){
        console.log("tracks inserted");
      });
    }      
  }.bind(this));
}
Tracks.prototype.removeAll = function(cb){
  db.tracks.remove(function(){
    db.lists.remove(cb);
  })
}
Tracks.prototype.getCategory = function(category,filter,cb){
  if(category !== 'Title'){
    db.tracks.distinct(category,filter,function(err,docs){
      if(docs && !err){
        cb({err:null,docs:docs.sort()});
      }else{
        cb({err:err,docs:null});
      }
        
    })      
  }else if(!filter.Album){
    db.tracks.find(filter,{Title:1}).sort({Title:1},function(err,docs){
        cb({err:err,docs:docs});
    })   
  }else{
    db.tracks.find(filter,{Title:1}).sort({Album:1,TrackNumber:1},function(err,docs){
        cb({err:err,docs:docs});
    })   
  }
}

var tracks = new Tracks();
module.exports = tracks;