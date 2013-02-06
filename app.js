
/**
 * Module dependencies.
 */

var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    routes = require('./routes'),
    list = require('./routes/playlists'),
    http = require('http'),
    path = require('path'),
    mw = require('./watcher.js'),
    categories = require('./controllers/categories_controller.js'),
    io = require('socket.io').listen(server),
    wu = require('./routes/wu.js'),
    playlists = require('./controllers/playlist_controller.js'),
    renderers = require('./controllers/renderer_controller.js')
    JST = require('./helpers/JST');

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get("/pop",function(req,res){
  res.render('popup', { title: 'Express' });
});
/*
app.get('/', routes.index);
app.get('/Artist', routes.index);
app.get('/tracklist', list.show);
app.get('/lists',list.lists);
app.get('/playlist',list.playlist);
app.get('/menu',list.menu);
*/

/*NEW ROUTES*/
app.get('/', wu.index);
app.get('/category/:category', wu.index);
app.get('/playlist/:id', wu.index);

app.get("/api/playlists",playlists.index);
app.post("/api/playlists",playlists.new);
app.put("/api/playlists/:id", playlists.add);
app.get("/api/playlists/:id", playlists.show);
app.get("/api/playlists/:id/tracks", playlists.showTracks);


app.get("/api/renderers", function(req,res){
   res.send(mw.renderer.getRenderers());
});
app.get("/api/renderers/:id", renderers.show);

app.get('/api/categories/:category', categories.show);
app.get('/JST.js', function(req,res){
  JST.render(function(result){
    console.log(result)
    res.send(result);
  })
});


/**********/

mw.listen(io);

io.sockets.on('connection', function (socket) {
  socket.join(mw.getRenderer());
  //Set current renderer
  socket.set("renderer",mw.getRenderer());
  if(mw.getRenderer()){
    socket.emit("setRendererResult",null,mw.getRenderer());
  }

  socket.on("setRenderer",function(uuid){
    console.log("IN setRenderer",uuid);
    var renderer = mw.renderer.exists(uuid);
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
      var renderer = mw.renderer.getRenderer(uuid);
      if(err || !renderer){
        socket.emit("error","renderer not found");
      }else{
        cb(renderer);
      }
    })
  }
  var doCommand = function(command){
    getRenderer(function(renderer){
      var args = Array.prototype.slice.call(arguments,1);
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
  socket.on('playById',function(id,playlistId){
    getRenderer(function(renderer){
      if(playlistId){
        renderer.setPlaylist(playlistId);
      }
      renderer.playById(id);
    })
  })


  socket.on('doPlay',mw.doPlay);
  socket.on('doStop',mw.doStop);
  socket.on("doPoll",mw.doPoll);
  socket.on("doGetInfo",mw.doGetInfo);


});

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});