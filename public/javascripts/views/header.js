Wu.Views.header = Backbone.View.extend({

  template: JST['header'],

  events: {
    "click .menuLink" : "toggleMenu"
  },

  initialize: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html);
    });
  },
  render: function(){
    this.subHeader && this.subHeader.render();
    return this;
  },
  unrender:function(){
    this.subHeader && this.subHeader.unrender();
  },
  setSubHeader: function(view){
    this.subHeader && this.subHeader.unrender();
    this.subHeader = view;
    this.$("#subnav").html(this.subHeader.render().$el);
  },
  toggleMenu: function(){
    this.trigger("menuClick");
  } 

});