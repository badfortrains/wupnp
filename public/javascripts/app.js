Wu = {
  Views: {},
  Models: {},
  Collections: {},
  Cache: {
    Models: {}
  },
  Routers: {},
  init: function(){
    this.Cache.Models.category = new Wu.Models.category({
      id : "Artist"
    })
    Wu.Cache.Categories = new Wu.Routers.Categories();

    Backbone.history.start({pushstate: true});
  }
}

$(document).ready(function(){
  window.Wu = Wu;
  Wu.init();
})