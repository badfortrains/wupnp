var db = require('./db'),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    Q = require("q");

var Tracks = function(){}
util.inherits(Tracks,EventEmitter);


//linkstation doesn't send track numbers, we can fix this by grouping by album and sorting by
//object id.
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

Tracks.prototype.drop_by_uuid = function(uuid,cb){
  var stmt = "delete FROM tracks WHERE server=?"
  db.run(stmt,uuid,function(err,docs){
    this.lastUpdated = Date.now();
  }.bind(this));
}

/**
 * Return a promise that fufills to a list of tracks
 * 
 * @param  {object} filter
 * @return {promise} 
 */
Tracks.prototype.find = function(filter){
  var where = filterToSQL(filter),
      stmt = db.prepare("SELECT _id FROM tracks "+where+" ORDER BY Album, TrackNumber");

  return Q.npost(stmt,"all")
}

Tracks.prototype.insert = function(data,uuid,updateById,cb){
  var i = 0,
      length = data.length,
      self = this;

  db.get("SELECT MAX (_id) FROM Tracks",function(err,row){
    var id;
    if(err){
      console.log("error getting track count");
      this.emit("error","Error inserting tracks "+err);
      return;
    }

    id = row['MAX (_id)']+1;

    db.serialize(function(){
      db.run("BEGIN TRANSACTION");

      //need these here, where statements are prepared determines where they are executed
      var stmt = db.prepare("INSERT OR IGNORE INTO tracks VALUES (?,?,?,?,?,?,?,?)"),
          resourceInsert = db.prepare("INSERT INTO resources VALUES (NULL,?,?,?)");

      data.forEach(function(item,index){
        stmt.run(id+index,item.TrackNumber || index,item.Title,item.Artist,item.Album,item.Didl,item.oID,uuid,function(err,res){
          if(!err && this.changes == 1){
            var track_id = this.lastID
            item.Resources && item.Resources.forEach(function(resource){
              resourceInsert.run(resource.Uri,resource.ProtocolInfo,track_id);
            });
          }
        })
      })

      stmt.finalize();

      db.run("COMMIT",function(err,res){
        if(err){     
          console.log("error inserting initial data into db");
          console.log(err);
          self.emit("error","Error inserting tracks "+err);
        }else{
          if(updateById)
            updateFromObjID();
          self.lastUpdated = Date.now();
          self.emit("tracksInserted",uuid);
          typeof(cb) === "function" && cb();
          console.log("tracks inserted");
        }     
      })
    }) 
  })
}

Tracks.prototype.getAlbumTracks = function(filter){
  var WHERE = filterToSQL(filter),
      statement;

  statement = "SELECT Title,_id,Album,TrackNumber FROM tracks " + WHERE + " ORDER BY Album, TrackNumber";
  return Q.npost(db,"all",[statement])
  .then(function(tracks){
    var tracksByAlbum = {};
    tracks.forEach(function(t){
      if(!tracksByAlbum[t.Album])
        tracksByAlbum[t.Album] = {};

      tracksByAlbum[t.Album][t.TrackNumber] = {_id: t._id, Title: t.Title, TrackNumber: t.TrackNumber};
    })
    return tracksByAlbum;
  })
}

Tracks.prototype.getAlbumArt = function(filter){
  var WHERE = filterToSQL(filter),
      statement;

  statement = "SELECT filename, size, album_image.album, url FROM tracks JOIN album_image ON(tracks.Artist=album_image.Artist AND tracks.Album=album_image.Album) " + WHERE + " GROUP BY album_image.album";
  return Q.npost(db,"all",[statement]);
}

Tracks.prototype.getAlbumDetails = function(filter){
  return Q.spread([this.getAlbumArt(filter),this.getAlbumTracks(filter)],
            function(images,tracks){
              return {
                tracks: tracks,
                images: images
              }
            }  
          )
}

Tracks.prototype.getArtistDetails = function(filter){
  var WHERE = filterToSQL(filter),
      statement;

  statement = "SELECT Artist, thumb FROM tracks JOIN artist ON(tracks.Artist=artist.title) " + WHERE + " GROUP BY tracks.Artist";
  return Q.npost(db,"all",[statement])
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
  db.get("SELECT Uri FROM resources WHERE track_id = ?",id,cb);
}

Tracks.prototype.findByUri = function(uri,cb){
  db.get("SELECT * FROM tracks JOIN resources ON track_id = _id WHERE Uri = ?",uri,cb)
}

Tracks.prototype.getCurrentTrackByUri = function(uri){
  var deferred = Q.defer();

  this.findByUri(uri,function(err,doc){
    if(!err && doc){
      this.getAlbumArt({_id: doc._id+""}).then(function(images){
        doc.images = images;
        deferred.resolve(doc);
      }).catch(function(e){
        deferred.reject(e);
      })
    }else{
      deferred.reject(err)
    }
  }.bind(this))

  return deferred.promise
}

var filterToSQL = function(filter){
  var where = "",
      quote;
  if(typeof(filter) === 'object' && Object.keys(filter).length > 0){
    where = "WHERE "
    for(var column in filter){
      quote = (filter[column].indexOf("'") === -1) ? "'" : '"';
      if(column == "TrackNumberGT"){
        where += "tracks.TrackNumber >=" + quote + filter[column] + quote + " AND " ;  
      }else{
        where += "tracks."+column + "=" + quote + filter[column] + quote + " AND " ;  
      }
      
    }
    where = where.substring(0,where.length - 5);
  }
  return where;
}

var tracks = new Tracks();
module.exports = tracks;
