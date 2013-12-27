var mw = require('../mediaWatcher'),
    Renderers = require('../models/renderer'),
    Servers = require('../models/servers'),
    Tracks = require('../models/tracks'),
    ir = require("../models/ir");

exports.registerEmits = function(namespace){
  Renderers.on("rendererAdded",function(event){
    namespace.emit("rendererAdded",event);
  })
  Renderers.on("rendererRemoved",function(event){
    namespace.emit("rendererRemoved",event);
  })
  Renderers.on("stateChange",function(uuid,event){
    namespace.in(uuid).emit("stateChange",event);
  })
  Tracks.on("tracksInserted",function(uuid){
    namespace.emit("tracksInserted",uuid);
  })
  Servers.on("serverAdded",function(server){
    namespace.emit("serverAdded",server);
  })
  Servers.on("serverRemoved",function(server){
    namespace.emit("serverRemoved",server);
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

  socket.on("sendIr",function(command){
    ir.sendCommand(command,function(err){
      if(err){
        socket.emit("error","ir command '"+command+"' failed")
      }
    })
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
  socket.on('next',function(){
    doCommand('next');
  })
  socket.on("playPlaylist",function(id){
    doCommand('playPlaylist',id)
  })
  socket.on("setPosition",function(position){
    doCommand('setPosition',position);
  })
  socket.on('playByPosition',function(position,playlistId){
    getRenderer(function(renderer){
      if(playlistId){
        renderer.setPlaylist(playlistId);
      }
      renderer.playAt(position);
    })
  })
};