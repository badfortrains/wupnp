Wu.Views.categoriesNav = Backbone.View.extend({

  template: JST['category.nav'],

  initialize: function(){
    this.listenTo(this.model,"change:id",this.updateActive);
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
    this.stopListening();
  },
  updateActive: function(model,category){
    this.$(".active").removeClass('active');
    this.$("."+category).addClass("active");
  }

});