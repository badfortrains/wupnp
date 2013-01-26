Wu.Views.categoriesNav = Backbone.View.extend({

  template: JST['category.nav'],

  initialize: function(){
    this.model.on("change:id",this.updateActive,this);
  },
  render: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html);
      self.updateActive({},self.model.get('id'));
    });
    return this;
  },
  unrender:function(){
    this.model.off("change:id",setActive);
  },
  updateActive: function(model,category){
    this.$(".active").removeClass('active');
    this.$("."+category).addClass("active");
  }

});