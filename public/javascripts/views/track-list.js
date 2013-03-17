Wu.Views.trackList = Backbone.View.extend({

  template: JST['track.list'],

  events: {
    "click .track-info"           : "play"
  },

  initialize: function(params){
    this.listenTo(Wu.Cache.Models.player,"change:currentPlayingTrack",this.highlight);
    this.listenTo(this,"inserted",this.highlight);
    this.listenTo(this,"swipeAway",this.delete);
    Wu.Mixin.mix(this,Wu.Mixin.swipeAway)
  },

  render: function(){
    var self = this;
    this.template({collection: this.collection},function(err,html){
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
    if($(e.currentTarget).parent().hasClass("transition")){
      return;
    }else{
      var id = $(e.currentTarget).parent().attr('id');
      Wu.Cache.Models.player.playById(id,this.model.get("_id"));
    }
  },
  delete:function(id){
    var track = this.collection.get(id);
    if(track){
      track.destroy({
        error:function(model,xhr){
          var message = xhr.responseText;
          Wu.Cache.Views.toastMaster.error(message);
        }
      })
    }
  }

});