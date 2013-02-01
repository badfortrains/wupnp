Wu.Routers.Categories = Backbone.Router.extend({
  routes: {
    ''              : 'index',
    'category/:id'  : 'show',
    'playlist/:id'  : 'showList'
  },

  index: function(){
    this.show('Artist');
  },

  show: function(id){
    var category = Wu.Cache.Models.category;
    category.setCategory(id);

    if(Wu.Layout.state != 'categories'){
      var nav = new Wu.Views.categoriesNav({
        model: category
      });
      var page = new Wu.Views.categories({
        model: category
      });

      category.fetch({
        success:function(){
          Wu.Layout.setSubHeader(nav);
          Wu.Layout.setPage(page);
          Wu.Layout.state = 'categories';
        },
        error:function(){
          Wu.Cache.Views.toastMaster.error("failed to get category");
        }
      });
    }    
  },

  showList: function(id){
    var playlist = Wu.Cache.Collections.playlists.get(id);
    if(playlist){
      var view = new Wu.Views.trackList({
          model:playlist,
          el: $("#category")
        });
      Wu.Layout.state = 'playlist';
      if(playlist.get("docs")){
        Wu.Layout.setPage(view);
      }else{
        playlist.fetch({
          success:function(){
            Wu.Layout.setPage(view);
          },
          error:function(model,xhr){
            Wu.Cache.Views.toastMaster.error(xhr.responseText);
          }
        })
      }
    }else{
      Wu.Cache.Views.toastMaster.error("Playlist not found");
    }
  }
});