
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , list = require('./routes/playlists')
  , http = require('http')
  , path = require('path')
  , mw = require('./watcher.js')

var app = express();

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
app.get('/', routes.index);
app.get('/Artist', routes.index);
app.get('/tracklist', list.show);
app.get('/lists',list.lists);
app.get('/playlist',list.playlist);
app.get('/menu',list.menu);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
