var db = require('mongojs').connect('test', ['tracks','playlist','lists']),
    Playlist = require("./playlist");

var now_playing = function(uuid){
  db.lists.findOne({renderer: uuid},function(err,doc){
    if(!err && doc){
      var pl = new playlist(doc._id);
      pl.uuid = uuid;
    }
  }
}