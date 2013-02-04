Wu.Views.menu = Backbone.View.extend({

  template: JST['menu'],

  events:{
    "click .renderers li"  : "setRenderer"
  },

  initialize: function(){
    this.listenTo(Wu.Layout.header,"menuClick",this.show);
    this.listenTo(this.collection,"add remove reset",this.render);
    this.listenTo(Wu.Cache.Collections.playlists,"add remove reset",this.render);
  },
  render: function(){
    var self = this;
    this.template({playlists:Wu.Cache.Collections.playlists, renderers: this.collection},function(err,html){
      self.$el.html(html);
    });
    return this;
  },
  unrender: function(){
    $("#mask").off("click",$.proxy(this.hide,this));
    this.stopListening();
  },
  show: function(){
    this.$el.removeClass("hide");
    $("#mask").show()
    .on("click",$.proxy(this.hide,this));
  },
  hide: function(){
    this.$el.addClass('hide');
    $("#mask").hide()
    .off("click",$.proxy(this.hide,this));
  },
  setRenderer: function(e){
    var uuid = $(e.target).attr("uuid");
    Wu.Cache.Models.player.setRenderer(uuid);
  }

});