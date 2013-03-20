var Playlists = require('../models/playlist').playlist,
    db = require('mongojs').connect('test');

module.exports = {
  index:function(req,res){
    var id = req.params.id,
        pl = new Playlists(id),
        categories = {
          Artist: 1,
          Album:  1,
          Title:  1
        };

    pl.findAt(1,{limit:false, categories:categories},function(err,docs){
      if(err){
        res.send(500,"failed to retrieve tracks");
      }else{
        res.send(docs);
      }
    });
  },
  delete:function(req,res){
    var trackId = req.params.track,
        id = req.params.id,
        filter = {_id: db.bson.ObjectID(trackId)},
        pl = new Playlists(id);

    pl.remove(filter,function(err){
      if(err){
        res.send(500,"failed to remove track");
      }else{
        res.send(200,{deleted:true});
      }
    })
  }
}