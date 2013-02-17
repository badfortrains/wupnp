Wu.Views.categoryList = Wu.Views.list.extend({

  ORDER: ["Artist","Album","Title"],

  events: {
    "click li:not(.jumper)" : "select",
    "click .title"          : "showPopup"
  },

  initialize:function(params){
    Wu.Views.list.prototype.initialize.call(this,params);
    this.url = params.url || "category/";

    this.listenTo(this.model,"change:docs",this.render);
  },

  render:function(){
    Wu.Views.list.prototype.render.call(this);
    this.trigger("rendered");
    return this;
  },

  unrender:function(){
    Wu.Views.list.prototype.unrender.call(this);
    this.$el.off();
    this.stopListening();
  },
  select: function(e){
    var category = this.model.filter($(e.target).html(),e.target.id);
    if(category)
      Backbone.history.navigate(this.url+category,{trigger:true});
    else
      this.trigger("showPopup")
  },
  showPopup:function(e){
    e.preventDefault();
    this.trigger("showPopup")
  }

});