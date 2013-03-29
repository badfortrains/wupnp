var db = require('./db'),
    util = require("util"),
    EventEmitter = require("events").EventEmitter;

var Tracks = function(){}
util.inherits(Tracks,EventEmitter);


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


Tracks.prototype.insert = function(data,cb){
  var i = 0,
      length = data.length,
      stmt = db.prepare("INSERT INTO tracks VALUES (NULL,?,?,?,?,?,?)"),
      resourceInsert = db.prepare("INSERT INTO resources VALUES (NULL,?,?,?)");

  data.forEach(function(item){
    stmt.run(item.TrackNumber,item.Title,item.Artist,item.Album,item.Didl,item.oID,function(){
      var lastID = this.lastID;
      item.Resources && item.Resources.forEach(function(resource){
        resourceInsert.run(resource.Uri,resource.ProtocolInfo,lastID);
      });
    })
  })

  stmt.finalize(function(err,docs){
    if(err){     
      console.log("error inserting initial data into db");
      console.log(err);
      this.emit("error","Error inserting tracks "+err);
    }else{
      //updateFromObjID();
      this.lastUpdated = Date.now();
      this.emit("tracksInserted");
      console.log("tracks inserted");
    }     
  }.bind(this));
}

Tracks.prototype.getCategory = function(category,filter,cb){
  var WHERE = filterToSQL(filter),
      statement;

  if(category !== 'Title'){
    statement = "SELECT DISTINCT "+category+" FROM tracks "+WHERE+" ORDER BY "+category;
  }else{
    statement = "SELECT Title,_id FROM tracks " + WHERE;
    if(filter.Album){
      statement += " ORDER BY Album, TrackNumber" 
    }else{
      statement += " ORDER BY Title" 
    }
  }

  db.all(statement,function(err,docs){
    if(err){
      cb(err,docs);
    }else{
      if(category != "Title"){
        var results = [];
        docs.forEach(function(el){
          results.push(el[category]);
        })
        cb(err,results);
      }else{
        cb(err,docs);
      }
    }
  });
}

Tracks.prototype.findByUri = function(uri,cb){
  db.get("SELECT * FROM tracks JOIN resources ON track_id = _id WHERE Uri = ?",uri,cb)
}

var filterToSQL = function(filter){
  var where = "";
  if(typeof(filter) === 'object' && Object.keys(filter).length > 0){
    where = "WHERE "
    for(var column in filter){
      where += column + "='" + filter[column] + "' AND "; 
    }
    where = where.substring(0,where.length - 5);
  }
  return where;
}

var tracks = new Tracks();
module.exports = tracks;
