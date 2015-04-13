Wu.Models.player = Backbone.Model.extend({
  urlRoot: '/api/renderers',
  idAttribute: 'uuid',

  initialize: function(){
    var self = this;
    Socket.on("stateChange",function(event){
      self.set(event.name,event.value);
    });
    Socket.on("setRendererResult",function(err,uuid){
      if(err){
        Wu.Cache.Views.toastMaster.error(err);
        self.clear();
      }else{
        self.set('uuid',uuid);
        self.fetch();
      }
    }),
    Socket.on("rendererRemoved",function(renderer){
      if(self.get('uuid') === renderer.uuid){
        self.clear();
      }
    });
    Socket.on("avrStateChange",function(state){
      self.set("avrState",state)
    })

    Socket.emit("avrState");
  },
  playListTrack: function(id,playlistId){
    Socket.emit("playListTrack",id,playlistId);
  },
  setRenderer: function(uuid){
    Socket.emit("setRenderer",uuid);
  }
});