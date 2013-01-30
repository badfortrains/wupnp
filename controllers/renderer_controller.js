var mw = require('../watcher.js');

module.exports = {
  show:function(req,res){
    var uuid = req.params.id,
        renderer = mw.renderer.getRenderer(uuid);

    if(!renderer){
      res.send(500,"Renderer not found");
    }else{
      console.log("RENDER",renderer)
      res.send(renderer.getAttributes());
    }
  }
}