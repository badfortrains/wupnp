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
    window.Socket = io.connect('http://localhost:3000');
    this.Cache.Models.category = new Wu.Models.category();
    this.Cache.Collections.renderers = new Wu.Collections.renderers();
    Wu.Cache.Categories = new Wu.Routers.Categories();
    Wu.Cache.playlists = new Wu.Collections.playlists();

    Wu.Cache.Views.categories = new Wu.Views.categories({
      model: this.Cache.Models.category
    })

    Wu.Cache.Views.playerTab = new Wu.Views.playerTab({
      el: $("#pullTab")
    }).render();
    
    this.Cache.Collections.renderers.fetch();
    Wu.Cache.Views.menu = new Wu.Views.menu({
      collection: this.Cache.Collections.renderers,
      el: $("#menu")
    }).render();

    $(document).on("click","a:not(.data-bypass)",function(e){
      e.preventDefault();
      Backbone.history.navigate($(e.target).attr('href'),{trigger:true});
    })

    Drawer.init({el:"#pullTab"});
    $("#pullTab").on("left",function(){
      $("#pullTab").css("left","0%");
    });
    $("#pullTab").on("right",function(){
      $("#pullTab").css("left","100%");
    });
    Backbone.history.start({pushState: true});
  }
}

$(document).ready(function(){
  window.Wu = Wu;
  Wu.init();
})