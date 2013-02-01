Wu.Views.listJumper = Backbone.View.extend({

  events: {
    "click .back"       : "hide",
    "click span.active" : "jump"
  },

  initialize: function(params){
    this.$listEl = $(params.list);
  },

  render: function(){
    this.$el.html(this.setupJumper());
    return this;
  },
  unrender:function(){
    $("#mask").off("click",$.proxy(this.hide,this));
  },
  setupJumper:function(){
    var current,
        html = "<div class='back icon-chevron-left'></div>";
    for(var i=65; i<91; i++){
      current = String.fromCharCode(i)
      if(this.$listEl.find('#jumper'+current).length > 0){
        html += '<span class="active">'+ current +'</span>';
      }else{
        html += '<span class="greyed">'+ current +'</span>';
      }
    }
    return html;
  },
  jump:function(e){
    var letter = $(e.target).html();
    this.$listEl.find("#jumper"+letter)[0].scrollIntoView();
    this.hide();
  },
  show: function(){
    this.$el.addClass('flipOut');
    $("#mask").on("click",$.proxy(this.hide,this));
    $("#mask").show();
  },
  hide: function(){
    this.$el.removeClass('flipOut');
    $("#mask").off("click",$.proxy(this.hide,this));
    $("#mask").hide();
  }

});