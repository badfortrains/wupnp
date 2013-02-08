Wu.Views.categoryPopup = Backbone.View.extend({

  template: JST['category.popup'],

  events: {
    "click h1.play"               : "playNow",
    "click h1.add"                : "showAddTo",
    "click h1.new"                : "showCreate",
    "click .cancel"               : "back",
    "submit .bottom-box.new form" : "createList",
    "click .bottom-box.add li"    : "addToList"
  },
  
  render: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html);
      self.setHeight();
    });
    return this;
  },

  unrender: function(){
    var filter = this.model.get("filter");
    filter && delete filter._id;
    $("#mask").off("click",$.proxy(this.hide,this));
  },

  setHeight: function(){
    var height = $(window).height() - (Math.round($(window).height() * .11)) - 100;

    height = Math.min(500,height);
    this.$(".bottom-box").css("max-height",height);
  },

  generateList: function(){
    var result = "<ul>";
    this.collection.each(function(el){

      result += "<li listId='"+el.get('_id')+"'>"+el.get('name')+"</li>";
    });
    result += "</ul>"
    return result;
  },

  showAddTo:function(){
    this.$el.addClass("add expand");
    this.collection.fetch({
      success: $.proxy(function(){
        this.$(".bottom-box.add").html(this.generateList());
      },this)
    }) 
  },

  showCreate:function(){
    this.$el.addClass("new expand");
  },

  back:function(){
    if(this.$el.hasClass('expand')){
      this.$el.removeClass("new add expand");
    }else{
      this.hide();
    }
  },

  show:function(){
    $("#mask").show();
    $("#mask").on("click",$.proxy(this.hide,this));
    this.$el.show();
  },

  hide:function(){
    $("#mask").hide();
    $("#mask").off("click",$.proxy(this.hide,this));
    this.$el.hide();
    this.$el.removeClass("new add expand");
    var filter = this.model.get("filter");
    filter && delete filter._id;
  },

  createList:function(e){
    e.preventDefault();
    var name = this.$(".bottom-box.new .name")[0].value;
    if(name == ""){
      alert("please enter a name")
    }else{
      var list = new Wu.Models.playlist({name:name}),
          filter = this.model.get("filter");

      list.set("filter",filter);
      list.save(null,{
        success:$.proxy(function(model){
          var message = 'Playlist "'+name+'" created with '+model.get("added")+' tracks';
          this.collection.add(model);
          Wu.Cache.Views.toastMaster.message(message);
        },this),
        error:function(model,xhr){
          var message = xhr.responseText;
          Wu.Cache.Views.toastMaster.error(message);
        }
      });
      list.set('filter',false);
      this.hide();
    }
  },
  playNow:function(){
    var id = Wu.Cache.Models.player.get("quickList"),
        list = this.collection.get(id);

    if(!list){
      Wu.Cache.Views.toastMaster.error("Must select a media renderer first");
      return;
    }

    list.set("clearFirst",true);
    this._add(list,function(){
      Socket.emit("playPlaylist");
    });
  },

  addToList:function(e){
    var id = $(e.target).attr('listId'),
        list = this.collection.get(id);
    this._add(list);
  },

  _add: function(list,cb){
    var filter = this.model.get("filter");

    list.set("filter",filter);
    list.save(null,{
      success:function(model){
        var message = model.get("added")+' tracks added to "'+list.get('name')+'" playlist';
        Wu.Cache.Views.toastMaster.message(message);
        typeof(cb) === 'function' && cb();
       },
      error:function(model,xhr){
        var message = xhr.responseText;
        Wu.Cache.Views.toastMaster.error(message);
      }
    });
    list.unset('filter');
    list.unset('clearFirst');
    this.hide();
  }

});