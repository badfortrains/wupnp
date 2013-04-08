
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
    playlist_tracks = require('./controllers/playlists_tracks_controller.js'),
    renderers = require('./controllers/renderer_controller.js'),
    servers = require('./controllers/server_controller'),
    categories = require('./controllers/categories_controller.js'),
    JST = require('./helpers/JST'),
    tracks = require('./models/tracks'),
    mw = require('./mediaWatcher'),
    mwb = require('./mediaWatcherWeb')
    connect = require('connect'),
    server_model = require("./models/servers"),
    httpProxy = require('http-proxy'),
    url = require('url');

    //tracks.removeAll(function(){
      mw.listen();
    //})
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(connect.compress());
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

/*Renderer*/
app.get('/renderer', wu.renderer);
/*Backbone routes*/
app.get('/', wu.index);
app.get('/category/:category', wu.index);
app.get('/playlist/:id', wu.index);
app.get('/directory/:uuid/:id', wu.index);

/* Data routes */
app.get("/api/playlists",playlists.index);
app.post("/api/playlists",playlists.new);
app.put("/api/playlists/:id", playlists.add);

app.get("/api/playlists/:id", playlist_tracks.index)
app.delete("/api/playlists/:id/:track", playlist_tracks.delete)

app.get("/api/renderers", renderers.index);
app.get("/api/renderers/:id", renderers.show);

app.get('/api/categories/:category', categories.show);

app.get('/api/directory/:ms/:id',servers.browse);
app.get('/api/servers/',servers.all);
app.get('/api/servers/:id',servers.find)
app.put('/api/servers/:id',servers.setPath)

app.get('/JST.js', function(req,res){
  JST.render(function(result){
    res.send(result);
  })
});
/**********/
socketRoutes.registerEmits(io.of('/controller'));
io.of('/controller').on('connection', socketRoutes.onConnect);
io.of('/renderer').on('connection', mwb.onConnect);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

httpProxy.createServer(function (req, res, proxy) {
  var parsed_url = url.parse(req.url),
      server = server_model.find(parsed_url.pathname.replace("/",""));

  if(server){
    var server_url = url.parse(server.baseUrl);
    req.url = req.url.replace(parsed_url.pathname+"?","/");

    proxy.proxyRequest(req, res, {
      host: server_url.hostname,
      port: server_url.port
    });
  }else{
    res.writeHead(404);
    res.end();
  }
}).listen(2000);