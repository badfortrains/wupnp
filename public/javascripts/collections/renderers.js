Wu.Collections.renderers = Backbone.Collection.extend({

  model: Wu.Models.renderer,
  url: '/api/renderers',

  initialize:function(){
    var self = this;
    Socket.on("rendererAdded",function(renderer){
      self.add(renderer);
    })
    Socket.on("rendererRemoved",function(renderer){
      self.remove(this.get(renderer.uuid));
    })
  }
});