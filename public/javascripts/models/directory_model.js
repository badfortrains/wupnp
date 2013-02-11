Wu.Models.directory = Backbone.Model.extend({

  idAttribute: "id",
  urlRoot: function(){
    return "/api/directory/"+this.get("uuid")+"/";
  },
  initialize:function(params){
    this.set("uuid",params.uuid);
  },
  filter:function(name,id){
    this.set("title",name);
    this.set("id",id);
  }

});