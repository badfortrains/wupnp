Wu.Routers.Categories = Backbone.Router.extend({
  routes: {
    ''                    : 'index',
    'category/:id'        : 'show',
    'playlist/:id'        : 'showList',
    'directory/:uuid/:id' : 'showDir',
    'test'                : 'testDir'
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
      Wu.Layout.menu.trigger("hideMusic");
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
      Wu.Layout.state = 'playlist';
      Wu.Layout.menu.trigger("showMusic");
      playlist.fetch({
        success:function(){
          var dropDown = new Wu.Views.playlistDropdown({
            model: playlist
          });
          var view = new Wu.Views.trackList({
            model:playlist,
            className: "category"
          });
          Wu.Layout.setSubHeader(dropDown);
          Wu.Layout.setPage(view);
        },
        error:function(model,xhr){
          Wu.Cache.Views.toastMaster.error(xhr.responseText);
        }
      })
    }else{
      Wu.Cache.Views.toastMaster.error("Playlist not found");
    }
  },
  testDir: function(){
    this.showDir("e91f16b6-f441-4de4-a65d-d1ed420c10e1","0");
  },
  showDir: function(uuid,dirID){
    if(Wu.Layout.state != 'directory'){
      Wu.Layout.removeSubHeader();
      var view = new Wu.Views.directories({
        model:Wu.Cache.Models.directory,
      });
      Wu.Layout.setPage(view);
      Wu.Layout.state = 'directory';
    }
    Wu.Layout.menu.trigger("showMusic");
    Wu.Cache.Models.directory.set("uuid",uuid);
    Wu.Cache.Models.directory.set("id",dirID);
  }
});