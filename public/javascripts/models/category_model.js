Wu.Models.category = Backbone.Model.extend({

  ORDER: ["Artist","Album","Title"],

  urlRoot: '/api/categories',

  fetch: function(options){
    options = options || {};
    options.data = _.extend({},options.data,{'filter':this.get('filter')})
    Backbone.Model.prototype.fetch.call(this,options);
  },

  filter: function(value){
    var filter = this.get("filter") || {},
        id = this.get('id'),
        index = _.indexOf(this.ORDER,id);
        
    index++;
    if(index < this.ORDER.length){
      filter[id] = value;
      this.set("filter",filter)
    }
    return this.ORDER[index];
  },
  setCategory: function(category){
    var filter = this.get("filter") || {},
        id = this.get('id'),
        currentIndex = _.indexOf(this.ORDER,id);
        newIndex = _.indexOf(this.ORDER,category);

    while(newIndex <= currentIndex){
      filter[this.ORDER[currentIndex]] && delete filter[this.ORDER[currentIndex]];
      currentIndex--;
    }
    this.set("filter",filter);
    this.set("id",category);
  },
  getTitle: function(){
    var filter = this.get("filter") || {},
        id = this.get('id'),
        index = _.indexOf(this.ORDER,id);

    while(--index >= 0){
      if(filter[this.ORDER[index]])
        return filter[this.ORDER[index]];
    }
    return false;
  }

});