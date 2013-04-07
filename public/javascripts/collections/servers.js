Wu.Collections.servers = Backbone.Collection.extend({

  model: Wu.Models.server,
  url: '/api/servers',

  setTracks: function(value){
    if(this.tracksInserted != value){
      this.tracksInserted = value;
      this.trigger("change:tracksInserted");
    }
  },

  initialize:function(){
    var self = this;
    Socket.on("serverAdded",function(server){
      if(server.status === 'inserted')
        self.setTracks(true);
      self.add(server);
    })
    Socket.on("serverRemoved",function(server){
      self.remove(this.get(server.uuid));
    })

    this.on("reset",function(){
      self.each(function(server){
        if(server.get('status') === 'inserted')
          self.setTracks(true);
      })
    })

    Socket.on("tracksInserted",function(uuid){
      console.log("tracksInserted",uuid )
      var server = self.get(uuid);
      server && server.set("status","inserted"); 
      self.setTracks(true);
    })

    this.hasTracks = false;
  }
});