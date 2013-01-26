Wu.Views.categories = Backbone.View.extend({

  template: JST['category.show'],

  initialize: function(){
    this.hasRendered = false;
    this.nav = new Wu.Views.categoriesNav({
      model: this.model,
      el: $(".nav-wrap")
    });

    this.list = new Wu.Views.categoryList({
      model: this.model,
      el: $("#category")
    })

    this.model.on("change:id",function(model,id){
      this.model.fetch();
    },this);
    this.model.on("change:docs",function(){
      if(!this.hasRendered){
        this.render();
      }else{
        this.list.render();
      }
    },this);
  },

  render: function(){
    this.list.render();
    this.nav.render();
    this.hasRendered = true;
    return this;
  },
  unrender: function(){
    this.model.off("change:id",this.model.fetch);
    this.model.off("change:docs",this.list.render);
    this.nav.unrender();
    this.list.unrender();
  }

});