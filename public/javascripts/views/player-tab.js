Wu.Views.playerTab = Backbone.View.extend({

  template: JST['player.tab'],

  events:{
    "click .play"  : "play",
    "click .next"  : "next"
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
  next: function(){
    Socket.emit("next");
  }

});