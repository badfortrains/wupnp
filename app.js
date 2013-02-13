
/**
 * Module dependencies.
 */

var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    http = require('http'),
    path = require('path'),
    io = require('socket.io').listen(server),
    wu = require('./routes/wu.js'),
    socketRoutes = require('./routes/socket'),
    playlists = require('./controllers/playlist_controller.js'),
    renderers = require('./controllers/renderer_controller.js'),
    servers = require('./controllers/server_controller'),
    categories = require('./controllers/categories_controller.js'),
    JST = require('./helpers/JST'),
    mw = require('./mediaWatcher').listen();

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

/*Backbone routes*/
app.get('/', wu.index);
app.get('/category/:category', wu.index);
app.get('/playlist/:id', wu.index);
app.get('/directory/:uuid/:id', wu.index);
app.get("/test",wu.index);

/* Data routes */
app.get("/api/playlists",playlists.index);
app.post("/api/playlists",playlists.new);
app.put("/api/playlists/:id", playlists.add);
app.get("/api/playlists/:id", playlists.show);
app.get("/api/playlists/:id/tracks", playlists.showTracks);

app.get("/api/renderers", renderers.index);
app.get("/api/renderers/:id", renderers.show);

app.get('/api/categories/:category', categories.show);

app.get('/api/directory/:ms/:id',server.browse);

app.get('/JST.js', function(req,res){
  JST.render(function(result){
    res.send(result);
  })
});
/**********/
socketRoutes.registerEmits(io);
io.sockets.on('connection', socketRoutes.onConnect);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});