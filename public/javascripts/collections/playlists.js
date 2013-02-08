Wu.Collections.playlists = Backbone.Collection.extend({

  initialize: function(){
    Socket.on("rendererAdded",$.proxy(function(){
      this.fetch();
    },this));
  },
  model: Wu.Models.playlist,
  url: '/api/playlists'

});
