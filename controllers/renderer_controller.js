var Renderers = require('../models/renderer'),
    Playlist = require('../models/playlist').Playlist,
    Tracks = require('../models/tracks')

module.exports = {
  _find_renderer: function(req,res,next){
    var uuid = req.params.id,
        renderer = Renderers.find(uuid);

    if(!renderer){
      res.send(404,"Renderer not found")
    }else{
      req.renderer = renderer
      next()
    }
  },
  show:function(req,res){
    res.send(req.renderer.getAttributes());
  },
  playNow: function(req,res){
    var filter = req.body.filter || {},
        renderer = req.renderer,
        position = renderer.quickListPosition(),
        pl = new Playlist({id:renderer.state.quickList})


    pl.add(Tracks.find(filter),position,true)
    .done(function(count){
      renderer.playAt(position)
      res.send({added:count, position: position})
    })
  },
  playNext: function(req,res){
    var filter = req.body.filter || {},
        renderer = req.renderer,
        position = renderer.position+1,
        pl = new Playlist({id:renderer.playlist.id})

    pl.add(Tracks.find(filter),position)
    .done(function(count){
      res.send({added:count})
    })
  },
  index: function(req,res){
   res.send(Renderers.all());
  }
}