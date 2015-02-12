
/**
 * Module dependencies.
 */
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    http = require('http'),
    path = require('path'),
    io = require('socket.io')(server,{
      'browser client minification': true,  // Send minified client
      'browser client etag': true,          // Apply etag caching logic based on version number
      'browser client gzip': true,          // Gzip the file
      'browser client expires': true        // Adds Cache-Control: private, x-gzip-ok="", max-age=31536000 header
    }),
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
    server_model = require("./models/servers");

var bodyParser = require('body-parser')
var methodOverride = require('method-override')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var errorhandler = require('errorhandler')

  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(connect.compress());
  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: true }))
  // parse application/json
  app.use(bodyParser.json())
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(session({
    secret: "our secret",
    resave: true,
    saveUninitialized: true
  }));
  app.use(require('less-middleware')(path.join(__dirname, '/public')));
  app.use(express.static(path.join(__dirname, 'public'),{ maxAge: process.env.NODE_ENV ? 2592000000 : 0 }));

// development only
if ('development' == app.get('env')) {
  app.use(errorhandler());
}

/*proxy web based track streams*/
app.get('/proxy/:id',wu.proxy);

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
app.delete("/api/playlists/:id",playlists.remove);

app.get("/api/playlists/:id", playlist_tracks.index)
app.delete("/api/playlists/:id/:track", playlist_tracks.delete)

app.get("/api/renderers", renderers.index);
app.get("/api/renderers/:id",renderers._find_renderer,renderers.show);
app.put("/api/renderers/:id/playNow",renderers._find_renderer,renderers.playNow);
app.put("/api/renderers/:id/playNext",renderers._find_renderer,renderers.playNext);

app.get('/api/categories/:category', categories.show);

app.get('/api/directory/:ms/:id',servers.browse);
app.get('/api/servers/',servers.index);
app.get('/api/servers/:id',servers.show)
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
