Wu.Views.playerTab = Backbone.View.extend({

  template: JST['player.tab'],

  events:{
    "click .icon-play"  : "play",
    "click .icon-pause" : "pause",
    "click .next"       : "next",
    "mousedown .ball"   : "dragStart",
    "touchstart .ball"  : "dragStart"
  },
  initialize: function(){
    this.listenTo(this.model,"change:currentPlayingTrack",this.changeTrack);
    this.listenTo(this.model,"change:TransportState",this.changePlayState);
    this.listenTo(this,"inserted",this.setupDrag);
    this.lastTime = Date.now();
    this.animator = this.animateProgress.bind(this);
    
    this.animateProgress();

    this.listenTo($(document),"mousemove touchmove",$.proxy(this.drag,this));
    this.listenTo($(document),"mouseup touchend",$.proxy(this.dragEnd,this));

    //prevent highlighting on desktop
    this.listenTo(this.$el,"mousedown",function(e){
      e.preventDefault();
    });
    this.listenTo($(window),"resize",$.proxy(function(){
      this.width = this.$el.width() - 50;    
    },this));
    this.animate = true;
  },

  render: function(){
    var self = this;
    this.template({model: this.model},function(err,html){
      self.$el.html(html);
      self.changeTrack(self.model,self.model.get("currentPlayingTrack"));
      self.changePlayState(self.model,self.model.get("TransportState"));
      self.setPosition(self.model.get('trackPosition'));
    });
    return this;
  },
  unrender:function(){
    this.stopListening();
  },
  animateProgress: function(){
    if(this.animate && !this.dragging && this.model.get("TransportState") === "PLAYING"){
      var position = this.model.get('trackPosition')
      this.setPosition(position);
      this.model.set("trackPosition",position + Date.now() - this.lastTime ); 
    }
    this.lastTime = Date.now();
    window.requestAnimationFrame(this.animator);
  },
  setPosition: function(position){
    var left = this.width * (position/ this.model.get("duration"));
    this.$(".ball").css("-webkit-transform","translate3d("+left+"px,0,0)");
  },
  dragStart: function(e){
    this.dragging = true;
    e.preventDefault();
  },
  drag:function(e){
    if(this.dragging){
      var x = e.pageX || e.touches[0].pageX;
      this.lastX = x;
      this.$(".ball").css("-webkit-transform","translateZ(0) translateX("+x+"px)");
    }
  },  
  dragEnd: function(){
    if(this.dragging){
      var position = (this.lastX / this.width) * this.model.get("duration");  
      Socket.emit("setPosition",position);
    }
    this.dragging = false;
    this.animate = false;
    var self = this;
    //Hack, wait some time so that our set position will get fed back to us
    setTimeout(function(){
      self.animate = true; 
    },1000)
    
  },
  setupDrag: function(){
    var self = this;
    this.width = this.$el.width() - 50;
    Drawer.init({el:this.$el});
    this.$el.on("left",function(){
      self.$el.css("left","0%");
    });
    this.$el.on("right",function(){
      if(!self.dragging){
        self.$el.css("left","100%");
      }
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
    this.$(".title").html(title)
    .attr("href","/playlist/"+model.get("playlist"));


    
    if(track){
      var parser=new DOMParser();
      var xmlDoc = parser.parseFromString(track.Didl,"text/xml");
      var artNode = xmlDoc.getElementsByTagName("albumArtURI")[0]
      if(artNode){
        var artURI = artNode.childNodes[0].nodeValue.replace(/160/g,"500");
        if(artURI != this.albumArt){
          $("body").css("background-image","url("+artURI+")");
          this.albumArt = artURI;
        }
      }
    }

  },
  changePlayState:function(model,value){
    if(value === "PLAYING"){
      this.$(".ball").show();
      this.$(".play").removeClass("icon-play").addClass("icon-pause");
    }else{
      this.$(".ball")[value === "PAUSED_PLAYBACK" ? "show" : "hide" ](); 
      this.$(".play").removeClass("icon-pause").addClass("icon-play");
    }
  }

});