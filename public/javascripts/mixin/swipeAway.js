Wu.Mixin.swipeAway = {
  touchable: 'ontouchstart' in document.documentElement,
  events: function(){
    map = {};
    if(this.touchable){
      map = {
        'touchstart .swipeEl' : 'start', 
        'touchmove  .swipeEl' : 'move',
        'touchend   .swipeEl' : 'end'
      }
    }else{
      map = {
        'mousedown .swipeEl'  : 'start', 
        'mousemove .swipeEl'  : 'move',
        'mouseout  .swipeEl'  : 'end',
        'mouseup   .swipeEl'  : 'end'
      }
    }
    map['webkitTransitionEnd .swipeEl'] = 'transitionEnd';
    map['transitionend .swipeEl'] = 'transitionEnd';
    map["click .swipeEl h1"] = "undo";
    return map;
  },
  position: function(e){
    return (e.touches) ? e.touches[0].pageX : e.pageX;
  },

  start: function(e){
    this.cover = $(e.currentTarget).find(".swipeCover");
    if($(e.currentTarget).hasClass('transition'))
      return;

    this.active = true;
    this.startX = this.position(e);
    this.started = true;
  
    if(!this.touchable)
      e.preventDefault();
  },
  move: function(e){
    if(this.active){
      var x = this.position(e);
      
      this.pos = Math.min(0,x - this.startX);
      this.cover.css("-webkit-transform","translate3d("+this.pos+"px,0,0)");
    } 
  },
  end: function(){
    if(this.active && this.pos < 0){
      this.active = false;
      this.cover.parent().addClass("transition");
      this.cover.css("-webkit-transform","translate3d(-"+this.cover.width()+"px,0,0)");
      
    }    
  },
  transitionEnd: function(e){
    if(e.propertyName.indexOf('transform') != -1){
      $(e.currentTarget).css("opacity",0);
    }else if(e.propertyName == 'opacity'){
      $(e.currentTarget).parent().hide();
      this.view.trigger("swipeAway",$(e.currentTarget).attr('id'));
    }
  },
  undo:function(){
    $(e.currentTarget).parent().removeClass("transition")
    .css("opacity",0);
  }

}