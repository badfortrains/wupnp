var Playlists = require('../models/playlist_new').Playlist;
module.exports = {
  index:function(req,res){
    var id = parseFloat(req.params.id),
        pl = new Playlists({id:id});

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
        pl = new Playlists({id:id});

    pl.remove(listTrackId)
    .then(function(){
      res.send(200,{deleted:true});
    }).fail(function(err){
      res.send(500,"failed to remove track");
    })
  }
}