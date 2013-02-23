Wu.Collections.servers = Backbone.Collection.extend({

  model: Wu.Models.server,
  url: '/api/servers',

  initialize:function(){
    var self = this;
    Socket.on("serverAdded",function(server){
      self.add(server);
    })
    Socket.on("serverRemoved",function(server){
      self.remove(this.get(server.uuid));
    })

    this.on("change:path",function(){
      self.pathSet = true;
    })

    this.pathSet = false;
  }
});