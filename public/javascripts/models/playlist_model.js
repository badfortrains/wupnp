Wu.Models.playlist = Backbone.Model.extend({
  urlRoot: '/api/playlists',
  idAttribute: "_id",
  add: function(filter,renderer,offset,cb){
    //renderer: uuid of renderer, used to find current track 
    //offset, add tracks offset number after currently
    //playing track.  If none set, add to end of playlist
    $.ajax({
      type: "put",
      data: {filter: filter, offset: offset, renderer:renderer},
      url: this.urlRoot + "/" +this.get("_id"),
      success: $.proxy(function(response){
        var message = response.added +' tracks added to "'+this.get('name')+'" playlist';
        Wu.Cache.Views.toastMaster.message(message);
        typeof(cb) === 'function' && cb(response);
      },this),
      error:function(xhr){
        var message = xhr.responseText;
        Wu.Cache.Views.toastMaster.error(message);
      }
    })
  }

});