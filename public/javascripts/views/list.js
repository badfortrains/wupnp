Wu.Views.list = Backbone.View.extend({

  template: JST['category.show'],

  initialize: function(params){
    if(!params || !params.noJumper){
      this.jumper = new Wu.Views.listJumper({
        list: this.$el,
        el: $("#alphabet")
      });
      this.$el.on("click",".jumper",$.proxy(this.jumper.show,this.jumper));
    }
  },

  render: function(){
    var self = this;
    this.template({model: this.model,jumper:this.jumper},function(err,html){
      self.$el.html(html);
      self.jumper && self.jumper.render();

      var topEl = self.$(".title")[0] || self.$("li")[0];
      topEl && topEl.scrollIntoView();
    });
    return this;
  },
  unrender:function(){
    this.jumper && this.jumper.unrender();
  }

});