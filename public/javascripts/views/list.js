Wu.Views.list = Backbone.View.extend({

  template: JST['category.show'],

  initialize: function(params){
    if(!params.noJumper){
      this.jumper = new Wu.Views.listJumper({
        list: this.$el,
        el: $("#alphabet")
      });
      this.$el.on("click",".jumper",$.proxy(this.jumper.show,this.jumper));
    }
  },

  render: function(){
    var self = this;
    this.template({model: this.model},function(err,html){
      self.$el.html(html);
      self.jumper && self.jumper.render();
      self.$("li")[0].scrollIntoView();
    });
    return this;
  },
  unrender:function(){
    this.jumper && this.jumper.unrender();
  }

});