Wu.Views.menu = Backbone.View.extend({

  template: JST['menu'],

  events:{
    "click .renderers li"  : "setRenderer"
  },

  initialize: function(){
    $(document).on("click",".menuLink",$.proxy(this.show,this))
    this.collection.on("reset",this.render,this);
  },
  render: function(){
    var self = this;
    this.template({renderers: this.collection},function(err,html){
      self.$el.html(html);
    });
  },
  unrender: function(){
    this.collection.off("change",this.render);
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
  setRenderer: function(){

  }

});