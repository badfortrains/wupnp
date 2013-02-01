Wu.Views.categoryList = Wu.Views.list.extend({

  ORDER: ["Artist","Album","Title"],

  events: {
    "click li:not(.jumper)" : "select",
    "click .title"          : "showPopup"
  },

  initialize:function(params){
    Wu.Views.list.prototype.initialize.call(this);

    this.listenTo(this.model,"change:docs",this.render);
  },

  render:function(){
    Wu.Views.list.prototype.render.call(this);
    this.trigger("rendered");
    return this;
  },

  unrender:function(){
    this.stopListening();
  },

  select: function(e){
    var category = this.model.filter($(e.target).html());
    Backbone.history.navigate('category/'+category,{trigger:true});
  },
  showPopup:function(e){
    e.preventDefault();
    this.trigger("showPopup")
  }

});