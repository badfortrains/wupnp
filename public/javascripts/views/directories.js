Wu.Views.directories = Backbone.View.extend({
  template: JST['directory.container'],

  events: {
    "click .popup .ok"     : "chooseDirectory",
    "click .popup .cancel" : "hidePrompt"
  },

  initialize: function(){
    this.list =  new Wu.Views.categoryList({
      model: this.model,
      className: 'category directory',
      url:"directory/",
      noJumper:true,
      loader:true,
      parent: this
    })

    this.listenTo(this.model,"change:id",function(){
      this.model.fetch({
        error:function(model,xhr){
          Wu.Cache.Views.toastMaster.error(xhr.responseText);
          window.history.back();
        }
      });
    });

    this.listenTo(this.list,"showPopup",this.showPrompt);
  },
  render: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html)
      self.$("#category-container").html(self.list.render().$el);
    });
    return this;
  },
  unrender: function(){
    this.stopListening();
    this.list.unrender();
  },
  showPrompt: function(){
    $("#mask").show();
    this.$(".popup").show();
  },
  hidePrompt: function(){
    $("#mask").hide();
    this.$(".popup").hide();
  },
  chooseDirectory: function(){
    var uuid = this.model.get("uuid"),
        dirId = this.model.get("id"),
        server = Wu.Cache.Collections.servers.get(uuid),
        title = this.model.getTitle(),
        name;

    if(server){
      name = server.get("name");
      server.save({path: dirId},{
        success: function(){
          Wu.Cache.Views.toastMaster.message('Adding tracks in "'+title+'" from "'+name+'"');
        },
        error: function(xhr){
          Wu.Cache.Views.toastMaster.error(xhr.responseText);
        }
      });
      Backbone.history.navigate("/",{trigger:true});
    }
  }

});