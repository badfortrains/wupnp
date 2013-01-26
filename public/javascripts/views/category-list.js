Wu.Views.categoryList = Wu.Views.list.extend({

  ORDER: ["Artist","Album","Title"],

  events: {
    "click li:not(.jumper)" : "select",
    "click .title"          : "showPopup"
  },

  render:function(){
    this.popup.hide();
    Wu.Views.list.prototype.render.call(this);
  },

  initialize:function(){
    Wu.Views.list.prototype.initialize.call(this);
    this.popup = new Wu.Views.categoryPopup({
      collection: Wu.Cache.playlists,
      model: this.model,
      el: $(".popup")
    })
    this.popup.render();
  },
  select: function(e){
    var category = this.model.filter($(e.target).html());
    Backbone.history.navigate('category/'+category,{trigger:true});
  },
  showPopup:function(e){
    e.preventDefault();
    this.popup.show();
  }

});