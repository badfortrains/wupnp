Wu.Layout = {
  init: function(){
    this.header = new Wu.Views.header({
      el: $("#header")
    });

    this.menu = new Wu.Views.menu({
      collection: Wu.Cache.Collections.renderers,
      el: $("#menu")
    }).render();
    this.menu.trigger('inserted');

    this.footer = new Wu.Views.playerTab({
      model: Wu.Cache.Models.player,
      el:$("#pullTab")
    }).render();
    this.footer.trigger("inserted");

  },
  setSubHeader : function(view){
    this.header.setSubHeader(view);
    this.header.render();
  },
  removeSubHeader : function(){
    this.header.removeSubHeader();
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