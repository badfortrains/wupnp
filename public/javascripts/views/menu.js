Wu.Views.menu = Backbone.View.extend({

  template: JST['menu'],

  events:{
    "click .renderers li"               : "setRenderer",
    "click .musicLink"                  : "gotoMusic",
    "click .playlists li .icon-trash"   : "deleteList",
    "swipeLeft"                         : "hide",
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
    this.listenTo(Wu.Cache.Models.player,"change:avrState",this.setVolume);
    this.listenTo(Wu.Cache.Collections.servers,"change:status",this.setStatus);
    this.$el.on("click","a",$.proxy(this.hide,this));
    this.setVolume();
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
  setVolume: function(){
    var avrState = Wu.Cache.Models.player.get("avrState");

    if(avrState){
      this.$(".zone1 .volume-number").html(avrState.z1Volume)
      this.$(".zone2 .volume-number").html(avrState.z2Volume)

      avrState.z1Power ? $(".zone1").addClass("isOn") : $(".zone1").removeClass("isOn")
      avrState.z2Power ? $(".zone2").addClass("isOn") : $(".zone2").removeClass("isOn")
    }
  },
  irCommand:function(e){
    //take the class name, minus 'icon' as the command
    var button = $(e.currentTarget);
    var zone = button.parent().hasClass("zone1") ? "z1" : "z2";
    var className = button.attr("class");
    var command;

    if(className == "icon-volume-up")
      command = "VolumeUp";
    else if(className == "icon-volume-down")
      command = "VolumeDown";
    else if(className == "icon-off")
      command = "Power";


    Socket.emit("avrCommand",zone+command)
  }

});