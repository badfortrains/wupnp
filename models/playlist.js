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
      cb(this.id,this);
    }.bind(this));
  }
  //Hack: assume id is already an objectID if it has toString and is 24 characters
  else if(typeof(id) === "object" && id.toString().length  === 24)
    this.id = id;
  else if(typeof(id) === 'string' && id.length === 24)
    try{
      this.id = db.bson.ObjectID(id)
    }catch(err){
      this.id = db.bson.ObjectID();
      this._create(id);
    }
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
    arguments[0]["playlist."+this.id.toString()] = {$exists:1};
  }
  return db.tracks.find.apply(db.tracks,arguments);
}

playlist.prototype.order = function(cursor,count,callback){
  var listId = this.id,
      oldCount = count;

  cursor.forEach(function(err,doc){
    if(err){
      callback(err);
    }else if(doc !== null){
      ++count;
      var obj = {};
      obj['playlist.'+listId.toString()] = count;
      db.tracks.update({_id:doc._id},{$set : obj })
    }else{
      db.lists.update({_id:listId},{$set:{count: count}});
      callback(null,count-oldCount);
    }
  })
},
/**
 * add all tracks matching filter to playlist
 * @param  {object}   filter   mongodb query object
 * @param  {Function} callback called on completion
 * @return {monogjs cursor}   
 */
playlist.prototype.add = function(filter,callback){
  assert(typeof(filter) == "object");
  this.getCount(function(err,count){
    if(err){
      callback(err);
    }else{
      var cursor = db.tracks.find(filter).sort({Album:1,TrackNumber:1});
      this.order(cursor,count,callback);
    }
  }.bind(this));
}
/**
 * remove all tracks matching filter from playlist
 * @param  {object}   filter   mongodb query object
 * @param  {Function} callback called on completion
 * @return {monogjs cursor}   
 */
playlist.prototype.remove = function(filter,callback){
  assert(typeof(filter) == "object");
  filter["playlist."+this.id] =  {$exists:1};
  var obj =  {};
  obj['playlist.'+this.id] = 1;
  db.tracks.update(filter,{$unset : obj }, {multi : true, safe:true},function(err,count){
    var filter = {},
        sort = {};
    filter["playlist."+this.id] =  {$exists:1};
    sort["playlist."+this.id] =  1;
    this.order(db.tracks.find(filter).sort(sort),0,callback);
  }.bind(this));
    

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
  return db.lists.findOne({_id: this.id},cb);
}

playlist.prototype.findList = function(){
  return db.lists.find.apply(db.lists,arguments);
}

//options: 
// limit: number || false for no limit  : default = 2
// categories: defualt {}
playlist.prototype.findAt = function(position,settings,cb){
  var id = this.id
      ,obj = {}
      ,sort = {}
      ,options = {};

  if(typeof(settings) === "function"){
    cb = settings;
  }else if(typeof(settings) === "object"){
    //options = _.extend({limit :2, categories: {}},settings);
    options.limit = (settings.limit === undefined) ? 2 : settings.limit;
    options.categories = (settings.categories === undefined) ? {} : settings.categories;
  }

  obj['playlist.'+this.id] = {$gte : position};
  sort['playlist.'+this.id] = 1;
  if(options.limit === false){
    db.tracks.find(obj,options.categories).sort(sort,function(err,docs){
      cb(err,docs);
    });
  }else{
    db.tracks.find(obj).sort(sort).limit(options.limit,function(err,docs){
      cb(err,docs);
    });
  }
},
playlist.prototype.getPosition = function(id,cb){
  try{
    var _id = (typeof(id) === "string") ? db.bson.ObjectID(id) : id,
        listId = this.id;
  }catch(err){
    cb(err,null);
    return;
  }

  this.find({_id:_id},{playlist:1},function(err,docs){
    if(err || !docs[0]){
      cb(err,null);
    }else{
      var position = docs[0].playlist[listId];
      cb(null,position);
    }
  })
}

exports.playlist = playlist;