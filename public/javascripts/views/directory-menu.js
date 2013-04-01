Wu.Views.directoryMenu = Backbone.View.extend({

  template: JST['server.menu'],

  events: {
    "click .refresh"  : "reloadTracks"
  },

  initialize: function(){
    this.changeServer();
    this.listenTo(this.model,"change:uuid",this.changeServer);
    this.listenTo(Wu.Cache.Collections.servers,"change:status",this.updateButtons);
  },

  render: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html);
    });
    return this;
  },
  unrender:function(){
    this.stopListening();
  },

  changeServer: function(){
    var uuid = this.model.get("uuid"),
        status;
    this.server = Wu.Cache.Collections.servers.get(uuid);
    this.updateButtons();
  },

  updateButtons: function(){
    status = this.server && this.server.get("status");
    if(!status){
      this.$el.hide();
    }else if(status === 'loading'){
      this.$el.show();
      this.$(".refresh").addClass("loading");
    }else if(status === 'inserted'){
      this.$el.show();
      this.$(".refresh").removeClass("loading");
    }
  },

  reloadTracks: function(){
    if(this.server){
      var name = this.server.get('name');
      this.server.save({},{
        success: function(){
          Wu.Cache.Views.toastMaster.message('Refreshing track from '+name);
          
        },
        error: function(xhr){
          Wu.Cache.Views.toastMaster.error(xhr.responseText);
        }
      })
    };
  }
});