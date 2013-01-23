Wu.Routers.Categories = Backbone.Router.extend({
  routes: {
    ''              : 'index',
    'category/:id'  : 'show'
  },

  index: function(){
    this.show('Artist');
  },

  show: function(id,params){
    var category = Wu.Cache.Models.category;
    category.set("id",id);
    category.fetch({
      success: function(){
        new Wu.Views.categories({
          model: category
        }).render();
      }
    });
  }
});