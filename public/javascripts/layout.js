Wu.Layout = {
  init: function(){
    this.header = new Wu.Views.header({
      el: $("#header")
    });

    this.menu = new Wu.Views.menu({
      collection: Wu.Cache.Collections.renderers,
      el: $("#menu")
    }).render();

  },
  setSubHeader : function(view){
    this.header.setSubHeader(view);
    this.header.render();
  },
  setPage: function(view){
    this.page && this.page.unrender();
    this.menu.hide();
    $("#mask").hide();
    $("#page").html(view.render().$el);
    view.trigger('inserted');
    this.page = view;
  }
}