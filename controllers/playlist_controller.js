var Playlists = require('../models/playlist').Playlist,
    Renderers = require('../models/renderer'),
    Tracks = require('../models/tracks')

module.exports = {
  index: function(req,res){
    var filter = req.query.filter || {};
    Playlists.prototype.all()
    .done(function(docs){
      res.send(docs);
    });
  },
  new: function(req,res){
    var filter = req.body.filter,
        name = req.body.name;
        
    var pl = new Playlists({name:name},function(id){
      if(filter){
        pl.add(Tracks.find(filter)).done(function(count){
          res.send({_id:id,added:count});
        });
      }else{
        res.send({_id:id,added:0});
      }
    });
  },
  add: function(req,res){
    var filter = req.body.filter || {},
        id = parseFloat(req.params.id),
        pl = new Playlists({id:id});


    pl.add(Tracks.find(filter))
    .then(function(count){
      res.send({added:count});
    }).fail(function(err){
      console.log("error adding tracks",err)
      res.send(500,"error adding tracks")
    })
  },
  remove: function(req,res){
    var id = parseFloat(req.params.id),
        pl = new Playlists({id:id});

    pl.drop().done(function(result){
      res.send(200,{deleted: true});
    });     
  }
}