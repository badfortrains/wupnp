Wu.Views.trackList = Backbone.View.extend({

  template: JST['track.list'],

  initialize: function(params){
    this.listenTo(Wu.Cache.Models.player,"change:currentPlayingTrack",this.highlight);
  },

  render: function(){
    var self = this;
    this.template({model: this.model},function(err,html){
      self.$el.html(html);
      self.$("li")[0].scrollIntoView();
      self.highlight();
    });
    return this;
  },
  unrender:function(){
    this.stopListening();
  },
  highlight:function(){
    var track = Wu.Cache.Models.player.get("currentPlayingTrack"),
        id = (track) ? track._id : false;
    this.$("li").removeClass("active");
    this.$("#"+id).addClass('active');
  }

});