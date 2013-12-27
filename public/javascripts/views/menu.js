Wu.Views.menu = Backbone.View.extend({

  template: JST['menu'],

  events:{
    "click .renderers li"               : "setRenderer",
    "click .musicLink"                  : "gotoMusic",
    "click .playlists li .icon-trash"   : "deleteList",
    "click .ir-controls div"            : "irCommand"
  },

  initialize: function(){
    this.listenTo(Wu.Layout.header,"menuClick",this.show);
    this.listenTo(this.collection,"add remove reset",this.render);
    this.listenTo(Wu.Cache.Collections.servers,"add remove reset",this.render);
    this.listenTo(Wu.Cache.Collections.playlists,"add remove reset",this.render);
    this.listenTo(this,"hideMusic",this.hideMusic);
    this.listenTo(this,"showMusic",this.showMusic);
    this.listenTo(Wu.Cache.Models.player,"change:id",this.setActive);
    this.listenTo(Wu.Cache.Models.player,"change:playlist",this.setActive);
    this.listenTo(Wu.Cache.Models.player,"change:TransportState",this.setActive);
    this.listenTo(Wu.Cache.Collections.servers,"change:status",this.setStatus);
    this.$el.on("click","a",$.proxy(this.hide,this));
  },
  render: function(){
    var self = this;
    this.template({
      playlists: Wu.Cache.Collections.playlists, 
      renderers: this.collection,
      servers: Wu.Cache.Collections.servers
    },function(err,html){
      self.$el.html(html);
      if(self.showMusicLink)
        self.showMusic();
      self.setActive();
    });
    return this;
  },
  unrender: function(){
    $("#mask").off("click",$.proxy(this.hide,this));
    this.stopListening();
  },
  deleteList: function(e){
    var id = $(e.currentTarget).parent().attr("id"),
        lists = Wu.Cache.Collections.playlists,
        playlist = lists.get(id);

    playlist && playlist.destroy();
  },
  show: function(){
    this.$el.removeClass("hide");
    $("#mask").show()
    .on("click",$.proxy(this.hide,this));
  },
  hide: function(){
    this.$el.addClass('hide');
    $("#mask").hide()
    .off("click",$.proxy(this.hide,this));
  },
  setRenderer: function(e){
    var uuid = $(e.currentTarget).attr("id");
    Wu.Cache.Models.player.setRenderer(uuid);
    this.hide();
  },
  hideMusic: function(){
    this.$(".musicLink").hide();
    this.showMusicLink = false;
  },
  showMusic:function(){
    this.$(".musicLink").show();
    this.showMusicLink = true;
  },
  gotoMusic:function(){
    var category = Wu.Cache.Models.category.get("id") || "Artist";
    this.hide();
    Backbone.history.navigate("/category/"+category,{trigger:true});
  },
  setStatus: function(model,value){
    $("#ms"+model.id).removeClass('loading').addClass(value);
  },
  setActive:function(){
    var renderer = Wu.Cache.Models.player.id,
        playlist = Wu.Cache.Models.player.get('playlist'),
        isPlaying = Wu.Cache.Models.player.get("TransportState") === "PLAYING";

    this.$("li").removeClass("active");
    playlist && $("#"+playlist)[isPlaying ? "addClass" : "removeClass"]("active");
    renderer && $("#"+renderer).addClass("active");
  },
  irCommand:function(e){
    //take the class name, minus 'icon' as the command
    command = $(e.currentTarget).attr("class").split("-").splice(1).join("-");
    Socket.emit("sendIr",command)
    //wait 2 seconds, then set the source to the rpi
    setTimeout(function(){
      Socket.emit("sendIr","set-source")
    },2000)
  }

});