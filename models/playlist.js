var db = require('mongojs').connect('test', ['tracks','playlist','lists']),
    assert = require('assert');



/**
 * playlist object initalized with an id (existing playlist) or name (new playlist)
 * @param  {id string | objectId | name string } id 
 */
var playlist = function(id){
  //Hack: assume id is already an objectID if it has toString and is 24 characters
  if(typeof(id) === "object" && id.toString().length  === 24)
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
    if(err){
      callback(err);
    }else{
      db.tracks.find(filter).forEach(function(err,doc){
        if(err){
          callback(err)
        }else if(doc !== null){
          ++count;
          db.tracks.update({_id:doc._id},{$addToSet : {playlist : listId, position: count} })
        }else{
          db.lists.update({_id:listId},{count: count});
          callback(null,count);
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
    return db.lists.insert({name:name,_id:this.id,count:0});
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

exports.playlist = playlist;