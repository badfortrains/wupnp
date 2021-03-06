Wu.Routers.Categories = Backbone.Router.extend({
  routes: {
    ''                    : 'index',
    'category/:id'        : 'show',
    'playlist/:id'        : 'showList',
    'directory/:uuid/:id' : 'showDir'
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
      Wu.Layout.setSubHeader(nav);
      Wu.Layout.setPage(page);
      Wu.Layout.state = 'categories';
      Wu.Layout.menu.trigger("hideMusic");

      category.fetch({
        error:function(){
          Wu.Cache.Views.toastMaster.error("failed to get category");
        }
      });
    }    
  },

  showList: function(id){
    var playlist = Wu.Cache.Collections.playlists.get(id),
        tracks;
    if(playlist){
      tracks = playlist.get("tracks") || playlist.set('tracks',new Wu.Collections.tracks({id:id})).get("tracks");
      Wu.Layout.state = 'playlist';
      Wu.Layout.menu.trigger("showMusic");
      tracks.fetch({
        success:function(){
          var dropDown = new Wu.Views.playlistDropdown({
            model: playlist
          });
          var view = new Wu.Views.trackList({
            model: playlist,
            collection:tracks,
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
  showDir: function(uuid,dirID){
    var oldID = Wu.Cache.Models.directory.get("uuid");
    if(Wu.Layout.state != 'directory'){
      var nav = new Wu.Views.directoryMenu({
        model: Wu.Cache.Models.directory
      });
      var view = new Wu.Views.directories({
        model:Wu.Cache.Models.directory
      });
      Wu.Layout.setSubHeader(nav);
      Wu.Layout.setPage(view);
      Wu.Layout.state = 'directory';
    }
    Wu.Layout.menu.trigger("showMusic");
    Wu.Cache.Models.directory.set("uuid",uuid);
    if(oldID != uuid){
      Wu.Cache.Models.directory.set({id:dirID},{silent:true});
      //trigger this ourselves, might be same id, but uuid has changed so is different directory
      Wu.Cache.Models.directory.trigger("change:id");
    }else{
      Wu.Cache.Models.directory.set({id:dirID});
    }
  }
});