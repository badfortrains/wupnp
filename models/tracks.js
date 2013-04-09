var db = require('./db'),
    util = require("util"),
    EventEmitter = require("events").EventEmitter;

var Tracks = function(){}
util.inherits(Tracks,EventEmitter);


var updateFromObjID = function(){
  var getAlbum = db.prepare("SELECT _id FROM tracks WHERE Artist = ? AND Album = ? ORDER BY oID"),
      updateTrack = db.prepare("UPDATE tracks SET TrackNumber = ? WHERE _id = ?");
  db.each("SELECT Artist,Album FROM tracks GROUP BY Album",function(err,group){
    var trackNumber = 1;
    getAlbum.each(group.Artist,group.Album,function(err,doc){
      updateTrack.run(trackNumber++,doc._id);
    });
  })
}


Tracks.prototype.insert = function(data,uuid,cb){
  var i = 0,
      length = data.length,
      stmt = db.prepare("INSERT OR IGNORE INTO tracks VALUES (NULL,?,?,?,?,?,?)"),
      resourceInsert = db.prepare("INSERT INTO resources VALUES (NULL,?,?,?)");

  db.run("BEGIN TRANSACTION");
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
      updateFromObjID();
      this.lastUpdated = Date.now();
      this.emit("tracksInserted",uuid);
      typeof(cb) === "function" && cb();
      console.log("tracks inserted");
    }     
  }.bind(this));
  db.run("COMMIT")
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

Tracks.prototype.urlById = function(id,cb){
  console.log("urlById",id);
  db.get("SELECT Uri FROM resources WHERE track_id = ?",id,cb);
}

Tracks.prototype.findByUri = function(uri,cb){
  db.get("SELECT * FROM tracks JOIN resources ON track_id = _id WHERE Uri = ?",uri,cb)
}

var filterToSQL = function(filter){
  var where = "",
      quote;
  if(typeof(filter) === 'object' && Object.keys(filter).length > 0){
    where = "WHERE "
    for(var column in filter){
      quote = (filter[column].indexOf("'") === -1) ? "'" : '"';
      where += column + "=" + quote + filter[column] + quote + " AND " ;  
    }
    where = where.substring(0,where.length - 5);
  }
  return where;
}

var tracks = new Tracks();
module.exports = tracks;
