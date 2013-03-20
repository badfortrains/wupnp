var Drawer = (function(){
  var options = {
      maxTime: 1000,
      maxDistance: 20,
      scopeEl: $("html"),
      xPadding: 0,
      yPadding: 0,
      drag:"horizontal"
      //must supply an options.el 
    },
    startPos = 0,
    startTime = 0,
    preventScroll = false,
    scrollLock = false,
    touch = "ontouchend" in document,
    startEvent = (touch) ? 'touchstart' : 'mousedown',
    moveEvent = (touch) ? 'touchmove' : 'mousemove',
    endEvent = (touch) ? 'touchend' : 'mouseup',
    yCutOff,
    xCutOff,
    yPad,
    xPad,
    $el,
    position,
    enabled = true;

  function yPos(e){
    return e.touches ? e.touches[0].pageY : e.pageY;
  }
  function xPos(e){
    return e.touches ? e.touches[0].pageX : e.pageX
  }

  function start(e){        
    var x = e.touches ? e.touches[0].pageX : e.pageX,
        y = e.touches ? e.touches[0].pageY : e.pageY,
        xDif = x - $el.offset().left,
        yDif = y - $el.offset().top;
    if(!enabled)
      return;

    if( yDif > yPad && yDif < yCutOff  && xDif < xCutOff && xDif > xPad){
      //e.preventDefault();
      startTime = e.timeStamp;
      if(options.drag == "horizontal")
        startPos = x;
      else
        startPos = y;
      preventScroll = true;
    }
  };
  function move(e){
    if(preventScroll){
      e.preventDefault();
      var currentPos = position(e),
          currentDistance = (startPos === 0) ? 0 : Math.abs(currentPos - startPos),
          maxTime = options.maxTime,
          maxDistance = options.maxDistance;
          // allow if movement < 1 sec
          currentTime = e.timeStamp;
      
      if (startTime !== 0 && currentTime - startTime < maxTime && currentDistance > maxDistance) {
        if (currentPos < startPos) {
          var dir = (options.drag == 'horizontal') ? 'left' : 'up';
          $el.trigger(dir);
          //swipe up
        }
        if (currentPos > startPos) {
          var dir = (options.drag == 'horizontal') ? 'right' : 'down';
          $el.trigger(dir);
          preventScroll = false;

          //swipe down
        }
        startTime = 0;
        startPos = 0;   
      }
    }else if(scrollLock == 'full'){
      e.preventDefault();
    }else if(scrollLock == 'partial'){
      if(!e.overide){
        e.preventDefault();
      }
    }
  }
  function end(e){
    startTime = 0;
    startPos = 0;
    preventScroll = false;
  }
  return{
    init: function(settings){
      $.extend(options,settings);
      $el = $(options.el);
      if(!$el || $el.length < 1)
        throw "Error: Need to supply a valid target element";
      yPad = options.yPadding;
      xPad = options.xPadding;
      xCutOff = $el.width() + xPad;
      yCutOff = $el.height() + yPad;
      options.scopeEl.on(startEvent,start)
        .on(moveEvent,move)
        .on(endEvent,end);
      position = (options.drag == 'horizontal') ? xPos : yPos;
      $(".nots").bind(moveEvent,function(e){
        e.xyz = true;
      });
      $el.on("toggleDrag",function(e,set){
        enabled = (set === undefined) ? !enabled : set;
      });
    },
    //open = true: open
    //open = false: close
    toggle: function(open){
      preventScroll = open;
    },
    lockScroll: function(lock){
      scrollLock = lock;
    }
  };
})();