Wu.Views.trackList = Backbone.View.extend({

  template: JST['track.list'],

  events: {
    "click li"           : "play"
  },

  initialize: function(params){
    this.listenTo(Wu.Cache.Models.player,"change:currentPlayingTrack",this.highlight);
    this.listenTo(this,"inserted",this.highlight);
    Wu.Mixin.mix(this,Wu.Mixin.swipeAway)
  },

  render: function(){
    var self = this;
    this.template({model: this.model},function(err,html){
      self.$el.html(html);
      self.$("li").length && self.$("li")[0].scrollIntoView();
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
    $("#"+id).addClass('active');
  },
  play: function(e){
    var id = e.currentTarget.id;
    Wu.Cache.Models.player.playById(id,this.model.get("_id"));
  }

});