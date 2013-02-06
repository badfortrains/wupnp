Wu.Views.toastMaster = Backbone.View.extend({


  initialize: function(){
    this.listenTo(Wu.Cache.Collections.renderers,"add",function(model){
      this.message('New media renderer "'+model.get("name")+'" detected');
    },this);
    this.listenTo(Wu.Cache.Collections.renderers,"add",function(model){
      this.message('Media renderer "'+model.get("name")+'" removed');
    },this);
    this.listenTo(Wu.Cache.Models.player,"change:currentPlayingTrack",function(model,value){
      this.title(value.Title);
    },this);
    this.listenTo(Wu.Cache.Models.player,"change:uuid",function(model,value){
      var renderer = Wu.Cache.Collections.renderers.get(value);
      if(renderer)
        this.message('Now playing to "'+renderer.get('name')+'" renderer');
      else
        this.message("No media renderer selected");
    },this);

    Socket.on("error",$.proxy(function(err){
      this.error(err);
    },this));

    this.messageStack = [];
  },
  title: function(text){
    window.clearTimeout(this.titleTimeout);
    $("title").html(text);
    this.titleTimeout = window.setTimeout(function(){
      $("title").html("Wu");
    },4000)
  },
  message: function(text){
    this.messageStack.push({text:text,type:'message'});
    this._show()
  },
  error: function(text){
    this.messageStack.push({text:text,type:'error'});
    this._show()
  },
  _add: function(text){
    this.messageStack.push(text);
    $(".toast").html(text)
    $(".toast-wrap").show();
    window.setTimeout(function(){
      $(".toast-wrap").hide();
    },4000);
  },
  _show: function(){
    if($(".toast-wrap").css("display") === "none" && this.messageStack.length){
      var toast = this.messageStack.shift();
      $(".toast-wrap")[toast.type === 'error' ? 'addClass' : 'removeClass']("error")
      .show();
      
      $(".toast").html(toast.text)

      window.setTimeout($.proxy(function(){
        $(".toast-wrap").hide();
        this._show();
      },this),4000);
    }
  }

});