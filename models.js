var db = require('mongojs').connect('test', ['tracks','playlist','lists']),
    assert = require('assert');


function flatten(collection,property){
  var result = [];
  if(typeof(collection) === 'object'){
    collection.forEach(function(item){
      result.push(item[property]);
    });
  }
  return result;
}
var positionSort = function(docs, positions){
  
  var compare = function(a,b){
    return positions.indexOf(a.oID) - positions.indexOf(b.oID);
  }
  docs.sort(compare);
}

var getList = function(id,category,filter,sort,cb){
  function search(positions){
    if(Object.keys(sort).length === 0){
      sort = {TrackNumber:1}
    }
    category.oID = 1;
    db.tracks.find(filter,category).sort(sort,function(err, docs){
      console.log(docs.length)
      if(err){ 
        console.log("err finding playlist"+err);
        return;
      }else{
        if(positions){
          positionSort(docs,positions);
          console.log("positions =");
          console.log(positions);
          console.log(docs)
          console.log("position sorted");
          console.log(docs);
        }

        cb(docs);
      }
    }); 
  }
  var objectFilter = {};
  console.log(sort)
  if(id !== false){
    id = db.bson.ObjectID(id);
    console.log("id ="+id);
    db.playlist.find({list_id: id},{_id:0,track_id:1,pos:1}).sort({pos:1},function(err,ids){
      if(err){
        console.log("err = "+err);
        return;
      }
      var oArray = flatten(ids,"track_id");
      filter["oID"] = {$in : oArray};

      search(oArray);
    })
  }else
    search();
}
exports.getList = getList;

exports.distinctList = function(id,category,filter,reverse,cb){
  function search(){
    db.tracks.distinct(category,filter,function(err, docs){
      if(err){ 
        console.log("err finding playlist"+err);
      }else if(!docs){
        return;
      }else{
        //reverse list if needed
        if(reverse){
          cb(docs.sort().reverse());
        }else
          cb(docs.sort());
      }
    })
  }
  if(id !== false){
    console.log("id ="+id);
    id =db.bson.ObjectID(id);
    db.playlist.find({list_id:id},{_id:0,track_id:1},function(err,ids){
      filter["oID"] = {$in : flatten(ids,"track_id")};
      console.log(filter);
      search();
    })
  }else
    search();

}


var lastPosition = function(id,cb){
  db.playlist.count({"list_id":id},function(err,count){
    if(err)
      console.log(err);
    else{
      cb(count);
    }
  })
}

var moveDown = function(id,count,position,cb){
  if(position < count){
      //move all tracks at or after position 1 down, to make room for our new tracks. 
      //db.tracks.update({playlist: {"$elemMatch": {_id: id, pos:{$gte: position}}}},{$inc : {"playlist.$.pos":distance}},false,true,function(err){
      db.playlist.update({list_id:id,pos: {$gte: position}},{$inc : {pos: count}},{multi:true},function(err){
        if(err){
          console.log(err)
          return;
        }
        cb();
      });
    }else{
      console.log("after move down");
      cb()
    }
}

var addTracks = function(id,position,tracks,cb){
  i = position;
  tracks.forEach(function(item){
    db.playlist.save({track_id:item.oID,pos:i++,list_id:id});
  });
  //return number of tracks saved (assumes saves are successful hacky)
  cb(tracks.length);
}

exports.playlist = {
  NOW_PLAYING: new db.bson.ObjectID("50578bdddcc92e2d0d000002"),
  add: function(source_id,dest_id,position,filter,sort,cb){
    if(!dest_id || dest_id == "null")
      dest_id = this.NOW_PLAYING;
    else if(typeof(dest_id) == 'string')
      dest_id = new db.bson.ObjectID(dest_id);

    getList(source_id,{oID:1},filter,sort,function(tracks){
      lastPosition(dest_id,function(list_size){
        if(position === -1)
          position = list_size;
        moveDown(dest_id,tracks.length,position,function(){
          addTracks(dest_id,position,tracks,cb)
        })
      })
    });
  }
}

id =db.bson.ObjectID("50cb71919a9a002420001f6b");
console.log("LLOOKING");
console.log(db.playlist.find())

exports.lists = {
  add: function(name,cb){
    db.lists.save({name:name},function(err,data){
      if(!err)
        cb({_id:data._id});
    });
  },
  show: function(sort,cb){
    db.lists.find().sort(sort,function(err,data){
      cb(data);
    });
  }
}




