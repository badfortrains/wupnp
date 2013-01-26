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
    category.setCategory(id);
    if(!Wu.Cache.Views.categories){
      Wu.Cache.Views.categories = new Wu.Views.categories({
        model: category
      }).render();
    }    
  }
});