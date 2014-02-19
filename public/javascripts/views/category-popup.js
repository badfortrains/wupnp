Wu.Views.categoryPopup = Backbone.View.extend({

  template: JST['category.popup'],

  events: {
    "click h1.play i"             : "playNow",
    "click h1.play .next"         : "playNext",
    "click h1.add"                : "showAddTo",
    "click h1.new"                : "showCreate",
    "click span.new"              : "showCreate",
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
    if(this.collection.length){
      var result = "<ul>";
      this.collection.each(function(el){

        result += "<li listId='"+el.get('_id')+"'>"+el.get('name')+"</li>";
      });
      result += "</ul>"
    }else{
      var result = "No exisiting playlists, <span class='new'>create one</span> to continue"
    }
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
    this.$el.removeClass("add")
    .addClass("new expand");

    this.$("input.name").val("");
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
    var player = Wu.Cache.Models.player,
        id = player.get("quickList"),
        list = this.collection.get(id),
        renderer = Wu.Cache.Models.player.get("uuid")

    if(!list){
      Wu.Cache.Views.toastMaster.error("Must select a media renderer first");
      return;
    }

    list.add(this.model.get("filter"),renderer,0,function(data){
      Wu.Cache.Models.player.playByPosition(data.position,id);
    });
    this.hide();
  },
  playNext:function(){
    var player = Wu.Cache.Models.player,
        id = player.get("playlist"),
        list = this.collection.get(id),
        renderer = Wu.Cache.Models.player.get("uuid")

    if(!list){
      Wu.Cache.Views.toastMaster.error("Must select a media renderer first");
      return;
    }

    list.add(this.model.get("filter"),renderer,1)
    this.hide();
  },
  addToList:function(e){
    var id = $(e.target).attr('listId'),
        list = this.collection.get(id);

    list.add(this.model.get("filter"))
    this.hide();
  }

});