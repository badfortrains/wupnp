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
    if(params && params.loader){
      var self =this;
      JST['loader']({},function(err,html){
        self.loaderHTML = html;
      })
      this.listenTo(this.model,"request",function(){
        this.$(".loader").show();
        $("#mask").show();
      });
    }
  },

  render: function(){
    var self = this;
    this.template({model: this.model,jumper:this.jumper},function(err,html){
      $("#mask").hide();
      self.$el.html(html);
      self.jumper && self.jumper.render();
      self.loaderHTML && self.$el.append(self.loaderHTML);
      var topEl = self.$(".title")[0] || self.$("li")[0];
      topEl && topEl.scrollIntoView();
    });
    return this;
  },
  unrender:function(){
    this.stopListening();
    this.jumper && this.jumper.unrender();
  }

});