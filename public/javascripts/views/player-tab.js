Wu.Views.playerTab = Backbone.View.extend({

  template: JST['player.tab'],

  events:{
    "click .icon-play"  : "play",
    "click .icon-pause" : "pause",
    "click .next"       : "next"
  },
  initialize: function(){
    this.listenTo(this.model,"change:currentPlayingTrack",this.changeTrack);
    this.listenTo(this.model,"change:TransportState",this.changePlayState);
    this.listenTo(this,"inserted",this.setupDrag);
  },

  render: function(){
    var self = this;
    this.template({model: this.model},function(err,html){
      self.$el.html(html);
      self.changeTrack(self.model,self.model.get("currentPlayingTrack"));
      self.changePlayState(self.model,self.model.get("TransportState"));
    });
    return this;
  },
  unrender:function(){
    this.stopListening();
  },
  setupDrag: function(){
    var self = this;
    Drawer.init({el:this.$el});
    this.$el.on("left",function(){
      self.$el.css("left","0%");
    });
    this.$el.on("right",function(){
      self.$el.css("left","100%");
    });
  },
  play: function(){
    Socket.emit("play");
  },
  pause: function(){
    Socket.emit("pause");
  },
  next: function(){
    Socket.emit("next");
  },
  changeTrack:function(model,track){
    var title = (track && track.Title) ? track.Title : "Unknown";
    this.$(".title").html(title);

    /*
    if(track){
      var parser=new DOMParser();
      var xmlDoc = parser.parseFromString(track.Didl,"text/xml");
      var artNode = xmlDoc.getElementsByTagName("albumArtURI")[0]
      if(artNode){
        var artURI = artNode.childNodes[0].nodeValue;
        if(artURI != this.albumArt){
          $("body").css("background-image","url("+artURI+")");
          this.albumArt = artURI;
        }
      }
    }*/

  },
  changePlayState:function(model,value){
    console.log("NEw TransportState",value);
    if(value === "PLAYING"){
      this.$(".play").removeClass("icon-play").addClass("icon-pause");
    }else{
      this.$(".play").removeClass("icon-pause").addClass("icon-play");
    }
  }

});