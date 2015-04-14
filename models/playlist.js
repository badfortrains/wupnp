var db = require('./db'),
    Q = require("q"),
    EventEmitter = require("events").EventEmitter;


db.qSerialize = Q.nbind(db.serialize,db)

//Event bridge for listening to global changes to playlists.
var PlaylistEmitter = new EventEmitter();

var Playlist = function(options){
  if(typeof options != "object"){
    throw "Bad playlist arguments"
  }
  if(options.id){
    this.id = options.id
  }
  else if(options.uuid && options.name){
    this.uuid = options.uuid;
    this.name = options.name
    db.get("SELECT _id FROM lists WHERE uuid = ?",this.uuid,function(err,doc){
      if(!err && doc){
        this.id = doc._id;
        options.cb && options.cb(this.id,this);
      }else{
        this._create(options.cb);
      }
    }.bind(this));
  }
  else if(options.name){
    this.name = options.name
    this._create(options.cb)
  }
}


//rewrite 
Playlist.prototype.resourcesAt = function(position,cb){
  var find = "SELECT resources.track_id,Uri,ProtocolInfo,Didl FROM playlist_tracks join resources ON (playlist_tracks.track_id = resources.track_id) join tracks ON (playlist_tracks.track_id == tracks._id) WHERE position = ? AND list_id = ?";
  db.all(find,position,this.id,function(err,docs){
    if(err || !docs.length){
      cb(err,null);
    }else{
      cb(err,{Resources:docs,Didl:docs[0].Didl});
    }
  })
}


/**HACK, add actual error handling
 * create a new playlist for current playlist obj
 * @param  {Function} callback
 */
Playlist.prototype._create = function(cb){
  var self = this;
  db.run("INSERT INTO lists VALUES (NULL,?,?,?)",this.name,0,this.uuid,function(err){
    if(!err){
      self.id = this.lastID;
      if(typeof(cb) == "function")
        cb(self.id,self);
    }
  });
}

Playlist.prototype._getCount = function(){
  return Q.npost(db,"get",["SELECT count FROM lists WHERE _id = ?",this.id])
  .then(function(row){
    return row.count
  })
}

/**
 * Delete playlist form list db, and remove all tracks
 * returns a promise, fufills when delete is complete
 */
Playlist.prototype.drop = function(){
  var listId = this.id,
      deferred = Q.defer()

  db.serialize(function(){
    db.run("BEGIN")
    db.run("DELETE FROM playlist_tracks WHERE list_id = ?",listId);
    db.run("DELETE FROM lists WHERE _id = ?",listId);
    db.run("COMMIT",function(err,res){
      if(err){
        deferred.reject(err)
      }else{
        PlaylistEmitter.emit("drop",listId)
        deferred.resolve(res)
      }
    })
  })
  
  return deferred.promise
}

Playlist.prototype.all = function(){
  return Q.npost(db,"all",["SELECT * FROM lists"])
}

//get all tracks in the playlist
//return a promise for the list of tracks
Playlist.prototype.tracks = function(){
  var columns = ["Artist","Album","Title","_id","position","id","filename"],
      query = "SELECT "+columns.join()+" FROM tracks JOIN playlist_tracks ON (track_id = _id) JOIN album_image ON(tracks.Artist=album_image.artist AND tracks.Album=album_image.Album and size='large') WHERE playlist_tracks.list_id = ? ORDER BY playlist_tracks.position"

  return Q.npost(db,"all",[query,this.id])
}

Playlist.prototype.getTrackPosition = function(id){
  return Q.npost(db,"get",["SELECT position FROM playlist_tracks WHERE id = ?",id])
  .then(function(row){
    return row.position
  })
}

//Remove track with give playlist_tracks id
//return 
Playlist.prototype.remove = function(id){
  var listId = this.id;

  return this.getTrackPosition(id)
  .then(function(position){
    var deferred = Q.defer()
    db.serialize(function(){
      db.run("BEGIN")
      db.run("DELETE FROM playlist_tracks WHERE list_id = ? AND position = ?",listId,position)
      db.run("UPDATE lists SET count = count - 1 WHERE _id = ?",listId)
      db.run("UPDATE playlist_tracks SET position = position - 1 WHERE list_id = ? AND position > ?",listId,position)
      db.run("COMMIT",function(err){
        if(err){
          deferred.reject(err)
        }else{
          PlaylistEmitter.emit("remove",listId,position)
          deferred.resolve(this)
        }
      })
    })
    return deferred.promise
  })
}

/**
 * Add tracks to playlist.  Returns a promise, resolving to number of tracks inserted
 * on success.
 * @param {array of track rows} tracks  : tracks to insert
 * @param {int} position : position to insert them at
 * @param {boolean} deleteAfter : true to delete tracks after position, false to move their
 * position back equal to the number of tracks inserted
 */
Playlist.prototype.add = function(trackPromise,position,deleteAfter){
  var listId = this.id;

  return Q.all([this._getCount(),trackPromise])
  .spread(function(count,tracks){
    var deferred = Q.defer();
         
    //insert at end of list if we don't have a given position
    position = typeof position === "number" ? position : count

    db.serialize(function(){
      var insert;
      db.run("BEGIN")

      if(deleteAfter){
        //remove all tracks after our insertion point
        db.run("DELETE FROM playlist_tracks WHERE list_id = ? AND position >= ?",listId,position)
        //deleted all tracks after position, tracks are zero indexed so count is now = position
        count = position
      }else{
        //move all tracks after position down by the number of tracks we're inserting
        db.run("UPDATE playlist_tracks SET position = position + ? WHERE list_id = ? AND position >= ?",tracks.length,listId,position)
      }

      //Need to prepare this here, since only db calls are serialized, not statement calls;
      //Thus a statement is run in the order that it was prepared, not run.
      insert = db.prepare("INSERT INTO playlist_tracks (list_id,track_id,position) VALUES (?,?,?)");
      for(var i=0;i<tracks.length;i++){
        insert.run(listId,tracks[i]._id,position++)
      }
      insert.finalize();

      //update count of list
      db.run("UPDATE lists SET count = ? WHERE _id = ?",count+tracks.length,listId);

      db.run("COMMIT",function(err){
        if(err){
          deferred.reject(err)
        }else{
          PlaylistEmitter.emit("add",listId,position)
          deferred.resolve(tracks.length)
        }
      })
    })
    return deferred.promise
  })
}

module.exports = {
  Playlist: Playlist,
  PlaylistEmitter: PlaylistEmitter
}
