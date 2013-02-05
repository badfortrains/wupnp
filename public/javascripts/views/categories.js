Wu.Views.categories = Backbone.View.extend({
  template: JST['category.container'],

  initialize: function(){
    this.list =  new Wu.Views.categoryList({
      model: this.model,
      className: 'category',
      parent: this
    })

    this.popup = new Wu.Views.categoryPopup({
      collection: Wu.Cache.Collections.playlists,
      model: this.model,
      className:'popup'
    })
    this.listenTo(this.model,"change:id",function(){
      this.model.fetch();
    });

    this.listenTo(this.list,"showPopup",function(){
      this.popup.show();
    })
    this.listenTo(this.list,"rendered",function(){
      this.popup.hide();
    })
  },
  render: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html)
      .append(self.popup.render().$el);

      self.$("#category-container").html(self.list.render().$el);
    });
    return this;
  },
  unrender: function(){
    this.stopListening();
    this.list.unrender();
  }

});