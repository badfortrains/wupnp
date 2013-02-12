Wu.Models.directory = Backbone.Model.extend({

  urlRoot: function(){
    return "/api/directory/"+this.get("uuid")+"/";
  },
  initialize:function(){
    this.titleMap = {};
  },
  filter:function(title,id){
    if(id){
      this.titleMap[id] = title;
      return this.get("uuid")+"/"+id;
    }else{
      return false;
    }
  },
  getTitle: function(){
    return this.titleMap[this.get("id")];
  }

});