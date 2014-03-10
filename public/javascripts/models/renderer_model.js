Wu.Models.renderer = Backbone.Model.extend({

  idAttribute: "uuid",
  urlRoot: '/api/renderers',
  _play: function(filter,verb,cb){
    $.ajax({
      type:'PUT',
      data: {filter:filter},
      url: this.urlRoot + "/" + this.get("uuid") + "/" + verb,
      success: $.proxy(function(response){
        var message = response.added +' tracks added to queue';
        Wu.Cache.Views.toastMaster.message(message);
        typeof(cb) === 'function' && cb(response);
      },this),
      error:function(xhr){
        var message = xhr.responseText;
        Wu.Cache.Views.toastMaster.error(message);
      }
    })
  },
  playNow: function(filter,cb){
    this._play(filter,"playNow",cb)
  },
  playNext: function(filter){
    this._play(filter,"playNext")
  }
});