Wu.Views.categoryPopup = Backbone.View.extend({

  template: JST['category.popup'],

  events: {
    "click h1.add"        : "add",
    "click h1.new"        : "newList",
    "click .new .cancel"  : "back",
    "click .add .cancel" : "back"
  },

  initialize: function(){

  },
  render: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html);
    });
    return this;
  },
  unrender: function(){

  },
  generateList: function(){
    var result = "<ul>";
    this.collection.each(function(el){

      result += "<li listId='"+el.get('id')+"'>"+el.get('name')+"</li>";
    });
    result += "</ul>"
    return result;
  },
  add:function(){
    this.$el.addClass("add");
    this.collection.fetch({
      success: $.proxy(function(){
        this.$(".bottom-box.add").html(this.generateList());
      },this)
    }) 
  },
  newList:function(){
    this.$el.addClass("new");
  },
  back:function(){
    this.$el.removeClass("new add");
  }

});