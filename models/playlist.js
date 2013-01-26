var db = require('mongojs').connect('test', ['tracks','playlist','lists']),
    assert = require('assert');



/**
 * playlist object initalized with an id (existing playlist) or name (new playlist)
 * @param  {id string | objectId | name string } id 
 */
var playlist = function(id,uuid,cb){
  //if uuid, check if a playlist already exists for that uuid otherwise create one
  if(uuid){
    this.uuid = uuid;
    db.lists.findOne({uuid: uuid},function(err,doc){
      if(!err && doc){
        this.id = doc._id; 
      }else{
        this.id = db.bson.ObjectID();
        this._create(id);
      }
      cb(this.id);
    }.bind(this));
  }
  //Hack: assume id is already an objectID if it has toString and is 24 characters
  else if(typeof(id) === "object" && id.toString().length  === 24)
    this.id = id;
  else if(typeof(id) === 'string' && id.length === 24)
    this.id = db.bson.ObjectID(id)
  else{
    this.id = db.bson.ObjectID();
    //create the new playlist with name (id)
    this._create(id);
  }
}

/**
 * mongojs find applied to only tracks in the playlist
 * arguments: filter(required - can be empty object) [categories][callback]
 * @return {monogjs cursor}   
 */
playlist.prototype.find = function(){
  //limit our search to tracks in our playlist
  if(typeof(arguments[0]) === "object"){
    arguments[0]["playlist.playlist"] = this.id;
  }
  return db.tracks.find.apply(db.tracks,arguments);
}
/**
 * add all tracks matching filter to playlist
 * @param  {object}   filter   mongodb query object
 * @param  {Function} callback called on completion
 * @return {monogjs cursor}   
 */
playlist.prototype.add = function(filter,callback){
  assert(typeof(filter) == "object");
  listId = this.id
  this.getCount(function(err,count){
    var oldCount = count
    if(err){
      callback(err);
    }else{
      db.tracks.find(filter).sort({TrackNumber:1}).forEach(function(err,doc){
        if(err){
          callback(err)
        }else if(doc !== null){
          ++count;
          db.tracks.update({_id:doc._id},{$addToSet : {playlist : {playlist : listId, position: count} } })
        }else{
          db.lists.update({_id:listId},{$set:{count: count}});
          callback(null,count-oldCount);
        }
      });
    }
  })
}
/**
 * remove all tracks matching filter from playlist
 * @param  {object}   filter   mongodb query object
 * @param  {Function} callback called on completion
 * @return {monogjs cursor}   
 */
playlist.prototype.remove = function(filter,callback){
  assert(typeof(filter) == "object");
  filter["playlist.playlist"] =  this.id;
  db.tracks.find(filter,function(err,docs){
    console.log(docs);
  })
  return db.tracks.update(filter,{$pull : {playlist : {playlist: this.id} }}, {multi : true},callback);
}
/**
 * Delete playlist form list db, and remove all tracks
 * @param  {Function} callback 
 */
playlist.prototype.drop = function(callback){
  var id = this.id;
  return this.remove({},function(){
    db.lists.remove({_id: id},callback)
  })
}
/**
 * create a new playlist
 * @param  {[type]}   name  : name of playlist
 * @param  {Function} callback 
 */
playlist.prototype._create = function(name){
  var list = {
    name:name,
    _id:this.id,
    count:0,
  }
  this.uuid && (list.uuid = this.uuid);
  return db.lists.insert(list);
}

playlist.prototype.getCount = function(callback){
  db.lists.findOne({_id:this.id},function(err,doc){
    if(err || doc === null){
      err = err || {error: "playlist not found"}
      callback(err);
    }else{
      callback(false,doc.count);
    }
  })
}

playlist.prototype.attributes = function(cb){
  return this.findList({_id: this.id},cb);
}

playlist.prototype.findList = function(){
  return db.lists.find.apply(db.lists,arguments);
}

playlist.prototype.findAt = function(position,cb){
  console.log(this.id)
  console.log("position",position)
  console.log({playlist: this.id,position:position})
  console.log("cb",cb);
  var objects = [
    {playlist: this.id,position:position},
    {playlist: this.id,position:position+1}
  ]
  //db.tracks.find({playlist: objects[0]},cb)
  var id = this.id;
  db.tracks.find({playlist : {$in:objects} },function(err,docs){
    if(docs.length < 2 || err)
      cb(err,docs);
    else{
      var reverse = false;
      docs[1].playlist.forEach(function(el){
        if(el.playlist === id && el.position === position){
          cb(err,docs.reverse());
          return;
        }
      });
      cb(err,docs);
    }
  });
}

exports.playlist = playlist;