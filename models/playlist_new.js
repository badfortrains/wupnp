var db = require('./db'),
    Q = require("q");


db.qSerialize = Q.nbind(db.serialize,db)

var Playlist = function(options){
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

/**HACK, add actual error handling
 * create a new playlist for current playlist obj
 * @param  {Function} callback
 */
playlist.prototype._create = function(cb){
  var self = this;
  db.run("INSERT INTO lists VALUES (NULL,?,?,?)",this.name,0,this.uuid,function(err){
    if(!err){
      self.id = this.lastID;
      if(typeof(cb) == "function")
        cb(self.id,self);
    }
  });
}

playlist.prototype._getCount = function(){
  return Q.npost(db,"get",["SELECT count FROM lists WHERE _id = ?",this.id])
  .then(function(row){
    return row.count
  })
}

/**
 * Delete playlist form list db, and remove all tracks
 * returns a promise, fufills when delete is complete
 */
playlist.prototype.drop = function(){
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
        deferred.resolve(res)
      }
    })
  })
  
  return deferred
}

playlist.prototype.all = function(){
  return Q.npost(db,"all",["SELECT name FROM lists"])
}

//get all tracks in the playlist
//return a promise for the list of tracks
playlist.prototype.tracks = function(){
  var columns = ["Artist","Album","Title","_id","position","id"],
      query = "SELECT "+columns+" FROM tracks JOIN playlist_tracks ON (track_id = _id) WHERE playlist_tracks.list_id = ? ORDER BY playlist_tracks.position"

  return Q.npost(db,"all",[query,this.id])
}

playlist.prototype.getTrackPosition = function(id){
  return Q.npost(db,"get",["SELECT position FROM playlist_tracks WHERE id = ?",id])
  .then(function(row){
    return row.position
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
playlist.prototype.add = function(trackPromise,position,deleteAfter){
  var listId = this.id,
      getPosition,
      length;

  getPosition = Q.fcall(function(){
    //insert at end of list if we don't have a given position
    return typeof position === "number" ? position : this._getCount()
  }.bind(this))

  return Q.all([getPosition,trackPromise])
  .spread(function(position,tracks){
    var deferred = Q.defer();
    db.serialize(function(){
      var insert;
      db.run("BEGIN")

      if(deleteAfter){
        //remove all tracks after our insertion point
        db.run("DELETE FROM playlist_tracks WHERE list_id = ? AND position >= ?",listId,position)
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
      db.run("UPDATE lists SET count = count + ? WHERE _id = ?",tracks.length,listId);

      db.run("COMMIT",function(err){
        if(err){
          deferred.reject(err)
        }else{
          deferred.resolve(tracks.length)
        }
      })
    })
    return deferred.promise
  })
}

exports.Playlist = Playlist
