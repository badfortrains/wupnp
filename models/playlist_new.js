var db = require('./db'),
    Q = require("q");


db.qSerialize = Q.denodeify(db.serialize)

var playlist = function(options){
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
 * Add tracks to playlist.  Returns a promise, resolving to number of tracks inserted
 * on success.
 * @param {array of track rows} tracks  : tracks to insert
 * @param {int} position : position to insert them at
 * @param {boolean} deleteAfter : true to delete tracks after position, false to move their
 * position back equal to the number of tracks inserted
 */
playlist.prototype.add = function(tracks,position,deleteAfter){
  var listId = this.id;

  return Q.fcall(function(){
    //insert at end of list if we don't have a given position
    return typeof position === "number" ? position : this._getCount()
  }.bind(this))
  .then(function(startPosition){
    //overwite the position argument, so we can access this value later
    position = startPosition
    return
  })
  .then(db.qSerialize())
  .then(function(){
    var insert = db.prepare("INSERT INTO playlist_tracks (list_id,track_id,position) VALUES (?,?,?)");
    db.run("BEGIN")

    
    if(deleteAfter){
      //remove all tracks after our insertion point
      db.run("DELETE playlist_tracks WHERE list_id = ? AND position >= ?",listId,position)
    }else{
      //move all tracks after position down by the number of tracks we're inserting
      db.run("UPDATE playlist_tracks SET position = position + ? WHERE list_id = ? AND position >= ?",tracks.length,listId,position)
    }

    tracks.forEach(function(track){
      insert.run(listId,track._id,position++)
    })

    //update count of list
    db.run("UPDATE lists SET count = count + ? WHERE _id = ?",tracks.length,listId);

    return Q.ninvoke(db,"run","COMMIT")
  })
  .then(function(){
    return tracks.length
  })
}

exports.playlist = playlist
