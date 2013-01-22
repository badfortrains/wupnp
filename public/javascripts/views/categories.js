Wu.Views.categories = Backbone.View.extend({

template: JST['category.show'],

render: function(){
  var $el = this.$el;
  this.template({model: this.model},function(err,html){
    $el.html(html);
  });
  return this;
}

});