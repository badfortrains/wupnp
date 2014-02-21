Wu.Views.categoryList = Wu.Views.list.extend({

  ORDER: ["Artist","Album","Title"],
  infoTemplate: JST['category.info'],

  events: {
    "click .category-list li:not(.jumper)" : "select",
    "click .title"          : "showPopup"
  },

  initialize:function(params){
    Wu.Views.list.prototype.initialize.call(this,params);
    if(params.url){
      this.url = params.url
    }else{
      this.url = "category/";
      this.isCategory = true;
    }

    this.listenTo(this.model,"change:docs",this.render);
    if(this.isCategory){
      this.listenTo(Wu.Cache.Collections.servers, "add remove", function(){
        if(this.isCategory && !Wu.Cache.Collections.servers.tracksInserted){
          this.render();
        }
      })
      this.listenTo(Wu.Cache.Collections.servers, "change:tracksInserted",this.render);
    }
  },

  render:function(){
    var self = this,
        docs = this.model.get("docs");

    if(!docs){
      return self
    }
    if(!this.isCategory || Wu.Cache.Collections.servers.tracksInserted){
      Wu.Views.list.prototype.render.call(this);
      $("#mask").hide();
      if(this.model.get("current_scroll")){
        this.el.scrollTop = this.model.get("current_scroll")
      }
      this.trigger("rendered");
    }else{
      this.infoTemplate({servers: Wu.Cache.Collections.servers},function(err,html){
        self.$el.html(html);
        $("#mask").show();
      })
    }
    return this;
  },

  unrender:function(){
    Wu.Views.list.prototype.unrender.call(this);
    this.$el.off();
    this.stopListening();
  },
  select: function(e){
    var category = this.model.filter($(e.target).text(),e.target.id,this.el.scrollTop);
    if(category)
      Backbone.history.navigate(this.url+category,{trigger:true});
    else
      this.trigger("showPopup")
  },
  showPopup:function(e){
    e.preventDefault();
    this.trigger("showPopup")
  }

});