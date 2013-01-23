Wu.Views.categories = Backbone.View.extend({

  template: JST['category.show'],

  initialize: function(){
    this.nav = new Wu.Views.categoriesNav({
      model: this.model,
      el: $(".nav-wrap")
    });

    this.list = new Wu.Views.categoryList({
      model: this.model,
      el: $("#category")
    })

    this.popup = new Wu.Views.categoryPopup({
      collection: Wu.Cache.playlists,
      el: $(".popup")
    })

    this.model.on("change:id",function(){
      this.model.fetch();
    },this);
    this.model.on("change:docs",this.list.render,this.list);
  },

  render: function(){
    this.list.render();
    this.nav.render();
    this.popup.render();
    return this;
  },
  unrender: function(){
    this.model.off("change:id",this.model.fetch);
    this.model.off("change:docs",this.list.render);
    this.nav.unrender();
    this.list.unrender();
  }

});