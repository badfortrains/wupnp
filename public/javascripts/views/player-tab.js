Wu.Views.playerTab = Backbone.View.extend({

  template: JST['player.tab'],

  events:{
    "click .icon-play"  : "play",
    "click .icon-pause" : "pause",
    "click .next"  : "next"
  },
  initialize: function(){
    this.listenTo(this.model,"change:currentTrack",this.changeTrack,this);
    this.listenTo(this.model,"change:TransportState",this.changePlayState,this);
  },

  render: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html);
    });
  },
  play: function(){
    Socket.emit("play");
  },
  pause: function(){
    Socket.emit("pause");
  },
  next: function(){
    Socket.emit("next");
  },
  changeTrack:function(model,track){
    var title = (track && track.Title) ? track.Title : "Unknown";
    this.$(".title").html(title);
  },
  changePlayState:function(model,value){
    if(value === "PLAYING"){
      this.$(".play").removeClass("icon-play").addClass("icon-pause");
    }else{
      this.$(".play").removeClass("icon-pause").addClass("icon-play");
    }
  }

});