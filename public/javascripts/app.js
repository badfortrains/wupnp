Wu = {
  Views: {},
  Models: {},
  Collections: {},
  Cache: {
    Models: {},
    Views: {},
    Collections: {}
  },
  Routers: {},
  init: function(){
    window.Socket = io.connect(':3000');
    this.Cache.Models.category = new Wu.Models.category();
    this.Cache.Models.player = new Wu.Models.player();
    this.Cache.Collections.renderers = new Wu.Collections.renderers();
    Wu.Cache.Categories = new Wu.Routers.Categories();
    Wu.Cache.Collections.playlists = new Wu.Collections.playlists();

    Wu.Cache.Views.toastMaster = new Wu.Views.toastMaster();
    
    this.Cache.Collections.renderers.fetch();
    this.Cache.Collections.playlists.reset(bootstrapPlaylists);

    $(document).on("click","a:not(.data-bypass)",function(e){
      e.preventDefault();
      Backbone.history.navigate($(e.target).attr('href'),{trigger:true});
    })

    Wu.Layout.init();
    Backbone.history.start({pushState: true});

  }
}

$(document).ready(function(){
  window.Wu = Wu;
  Wu.init();
})