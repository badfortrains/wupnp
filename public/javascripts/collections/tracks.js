Wu.Collections.tracks = Backbone.Collection.extend({
  model: Wu.Models.tracks,
  initialize: function(params){
    this._id = params.id;
  },
  url: function(){
    return '/api/playlists/'+this._id;
  }
});
