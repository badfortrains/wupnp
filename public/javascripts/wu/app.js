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
    window.Socket = io.connect('/controller');
    this.Cache.Models.category = new Wu.Models.category();
    this.Cache.Models.directory  = new Wu.Models.directory();
    this.Cache.Models.player = new Wu.Models.player();
    this.Cache.Collections.renderers = new Wu.Collections.renderers();
    Wu.Cache.Categories = new Wu.Routers.Categories();
    Wu.Cache.Collections.playlists = new Wu.Collections.playlists();
    Wu.Cache.Collections.servers  = new Wu.Collections.servers();

    Wu.Cache.Views.toastMaster = new Wu.Views.toastMaster();
    
    this.Cache.Collections.servers.reset(bootstrapServers);
    this.Cache.Collections.renderers.reset(bootstrapRenderers);
    this.Cache.Collections.playlists.reset(bootstrapPlaylists);

    $(document).on("click","a:not(.data-bypass)",function(e){
      e.preventDefault();
      Backbone.history.navigate($(e.target).attr('href'),{trigger:true});
    })

    $(document).on("swipeRight",".category",function(){
      window.history.back();
    })

    Wu.Layout.init();
    Backbone.history.start({pushState: true});

  }
}


window.addEventListener('load', function() {
    FastClick.attach(document.body);
}, false);

$(document).ready(function(){
  window.Wu = Wu;
  Wu.init();
})