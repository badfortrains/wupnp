Wu.Models.category = Backbone.Model.extend({

  ORDER: ["Artist","Album","Title"],

  urlRoot: '/api/categories',

  fetch: function(options){
    var filter = this.get('filter');
    options = options || {};
    options.data = _.extend({},options.data,{'filter':filter})
    Backbone.Model.prototype.fetch.call(this,options);
    //remove _id, since we only added it to add a track
    if(filter && filter._id)
      delete filter._id;

  },

  filter: function(value,_id){
    var filter = this.get("filter") || {},
        id = this.get('id'),
        index = _.indexOf(this.ORDER,id);
        
    index++;
    if(index < this.ORDER.length){
      filter[id] = value;
      this.set("filter",filter)
    }else if(id === "Title"){
      filter._id = _id;
    }
    return this.ORDER[index];
  },
  setCategory: function(category){
    var filter = this.get("filter") || {},
        id = this.get('id'),
        currentIndex = _.indexOf(this.ORDER,id);
        newIndex = _.indexOf(this.ORDER,category);
    
    //remove _id, since we only added it to add a track
    if(filter && filter._id)
      delete filter._id;
    
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