var Playlists = require('../models/playlist').playlist;
module.exports = {
  index:function(req,res){
    var id = parseFloat(req.params.id),
        pl = new Playlists(id),
        categories = {
          Artist: 1,
          Album:  1,
          Title:  1,
          _id: 1,
          position: 1
        };

    pl.findAt(0,{limit:false, categories:categories},function(err,docs){
      if(err){
        res.send(500,"failed to retrieve tracks");
      }else{
        res.send(docs);
      }
    });
  },
  delete:function(req,res){
    var position = parseFloat(req.params.track),
        id = parseFloat(req.params.id),
        pl = new Playlists(id);

    pl.remove(position,function(err){
      if(err){
        res.send(500,"failed to remove track");
      }else{
        res.send(200,{deleted:true});
      }
    })
  }
}