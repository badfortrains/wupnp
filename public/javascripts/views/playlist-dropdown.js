Wu.Views.playlistDropdown = Backbone.View.extend({

  template: JST['playlist.dropdown'],

  events:{
    "click .opened .current"  : "hide",
    "click .current"          : "show"
    
    
  },

  render: function(){
    var self = this;
    this.template({currentList: this.model, playlists: Wu.Cache.Collections.playlists},function(err,html){
      self.$el.html(html);
    });
    return this;
  },
  unrender:function(){
    $("#mask").off("click",$.proxy(this.hide,this));
    this.stopListening();
  },
  show: function(e){
    $("#mask").show();
    $("#mask").on("click",$.proxy(this.hide,this));
    this.$(".dropDown").addClass("opened");
    this.$(".down").removeClass("icon-angle-down").addClass("icon-angle-up");
    e.stopImmediatePropagation()
  },
  hide:function(e){
    $("#mask").hide();
    $("#mask").off("click",$.proxy(this.hide,this));
    this.$(".dropDown").removeClass("opened");
    this.$(".down").removeClass("icon-angle-up").addClass("icon-angle-down");
    e.stopImmediatePropagation()
  }

});