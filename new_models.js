var db = require('mongojs').connect('test', ['tracks','playlist','lists']),
    assert = require('assert');



var playlist = function(id){
  //Hack: assume id is already an objectID if it has toString and is 24 characters
  if(typeof(id) === "object" && id.toString().length  === 24)
    this.id = id;
  else if(typeof(id) === 'string' && id.length === 24)
    this.id = db.bson.ObjectID(id)
  else{
    this.id = db.bson.ObjectID();

  }
}

playlist.prototype = db.tracks;
/**
 * mongojs find applied to only tracks in the playlist
 * arguments: filter(required - can be empty object) [categories][callback]
 * @return {monogjs cursor}   
 */
playlist.prototype.find = function(){
  //limit our search to tracks in our playlist
  if(assert(typeof(arguments[0]) === "object")){
    arguments[0]["playlists"] = this.id;
  }
  return db.tracks.find.apply(this,arguments)
}
/**
 * add all tracks matching filter to playlist
 * @param  {object}   filter   mongodb query object
 * @param  {Function} callback called on completion
 * @return {monogjs cursor}   
 */
playlist.prototype.add = function(filter,callback){
  assert(typeof(filter) == "object");
  return db.tracks.update.call(this,filter,{$addToSet : {playlist : this.id} }, {multi : true},callback);
}
/**
 * remove all tracks matching filter from playlist
 * @param  {object}   filter   mongodb query object
 * @param  {Function} callback called on completion
 * @return {monogjs cursor}   
 */
playlist.prototype.remove = function(filter,callback){
  assert(typeof(filter) == "object");
  filter["playlist"] = this.id;
  return db.tracks.update.call(this,filter,{$pull : {playlist : this.id} }, {multi : true},callback);
}
playlist.prototype.drop = function(callback){
  var id = this.id;
  return this.remove({},function(){
    db.lists.remove({_id: id},callback)
  })
}
playlist.prototype.create = function(name,callback){
  if(typeof(callback) === "function")
    return db.lists.insert({name:name,_id:this.id},callback);
  else
    return db.lists.insert({name:name,_id:this.id});
}

exports.playlist = playlist;