Wu.Views.categoryList = Wu.Views.list.extend({

  ORDER: ["Artist","Album","Title"],

  events: {
    "click li:not(.jumper)" : "select"
  },

  select: function(e){
    this.model.select($(e.target).html());
  }

});