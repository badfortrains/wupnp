var Renderers = require('../models/renderer');

module.exports = {
  show:function(req,res){
    var uuid = req.params.id,
        renderer = Renderers.find(uuid);

    if(!renderer){
      res.send(500,"Renderer not found");
    }else{
      res.send(renderer.getAttributes());
    }
  },
  update:function(req,res){
    var uuid = req.params.id,
        renderer = Renderers.find(uuid);

    if(!renderer){
      res.send(500,"Renderer not found");
    }else{
      if(req.body.playlistId){
        renderer.setPlaylist(req.body.playlistId);
      }
      if(req.body.trackId){
        renderer.playById(req.body.trackId)
      }
      res.send(renderer.getAttributes());
    }
  },
  index: function(req,res){
   res.send(Renderers.all());
  }
}