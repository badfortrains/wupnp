var mw = require('../mediaWatcher'),
    Renderers = require('../models/renderer');

exports.registerEmits = function(socketIO){
  Renderers.on("rendererAdded",function(event){
    socketIO.sockets.emit("rendererAdded",event);
  })
  Renderers.on("rendererRemoved",function(event){
    socketIO.sockets.emit("rendererRemoved",event);
  })
  Renderers.on("stateChange",function(uuid,event){
    socketIO.sockets.in(uuid).emit("stateChange",event);
  })
}


exports.onConnect = function(socket) {
  socket.join(Renderers.getOne());
  //Set current renderer
  socket.set("renderer",Renderers.getOne());
  if(Renderers.getOne()){
    socket.emit("setRendererResult",null,Renderers.getOne());
  }

  socket.on("setRenderer",function(uuid){
    var renderer = Renderers.exists(uuid);
    if(!renderer){
      socket.emit("setRendererResult","Renderer no longer exists");
    }else {
      socket.get("renderer",function(err,oldUUID){
        if(oldUUID === uuid){
          return
        }else{
          socket.set("renderer",uuid);
          socket.leave(oldUUID);
          socket.emit("setRendererResult",null,uuid);
          socket.join(uuid);
          
        }
      });
    }
  })
  var getRenderer = function(cb){
    socket.get("renderer",function(err,uuid){
      var renderer = Renderers.find(uuid);
      if(err || !renderer){
        socket.emit("error","renderer not found");
      }else{
        cb(renderer);
      }
    })
  }
  var doCommand = function(command){
    var args = Array.prototype.slice.call(arguments,1);
    getRenderer(function(renderer){
      console.log(args)
      renderer[command].apply(renderer,args);
    })
  }
  socket.on('pause',function(){
    doCommand('pause');
  })

  socket.on('play', function(){
    doCommand('play');
  })
  socket.on('setList', function(id){
    doCommand('setPlaylist',id)
  })
  socket.on('next',function(){
    doCommand('next');
  })
  socket.on("playPlaylist",function(){
    doCommand('_playTrack');
  })
  socket.on("setPosition",function(position){
    console.log("POSITION",position)
    doCommand('setPosition',position);
  })
  socket.on('playById',function(id,playlistId){
    getRenderer(function(renderer){
      if(playlistId){
        renderer.setPlaylist(playlistId);
      }
      renderer.playById(id);
    })
  })
};