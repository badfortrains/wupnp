var Playlists = require('../models/playlist').playlist;
module.exports = {
  index:function(req,res){
    var id = parseFloat(req.params.id),
        pl = new Playlists(id);

    pl.tracks()
    .then(function(docs){
      res.send(docs);
    })
    .fail(function(err){
      res.send(500,"failed to retrieve tracks");
    })

  },
  delete:function(req,res){
    var listTrackId = parseFloat(req.params.track),
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