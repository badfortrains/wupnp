var mw = require('../watcher.js');

module.exports = {
  show:function(req,res){
    var uuid = req.params.id,
        renderer = mw.renderer.getRenderer(uuid);

    if(!renderer){
      res.send(500,"Renderer not found");
    }else{
      res.send(renderer.getAttributes());
    }
  },
  update:function(req,res){
    var uuid = req.params.id,
        renderer = mw.renderer.getRenderer(uuid);

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
  }
}