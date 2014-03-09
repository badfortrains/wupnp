var Playlists = require('../models/playlist').Playlist,
    Renderes = require('../models/renderer'),
    Servers = require('../models/servers'),
    Tracks = require('../models/tracks'),
    httpProxy = require('http-proxy'),
    url = require('url');

exports.index = function(req, res){
  Playlists.prototype.all()
  .done(function(docs){
    var lists = "",
        renderers = "var bootstrapRenderers =" + JSON.stringify(Renderes.all()),
        servers = "var bootstrapServers =" + JSON.stringify(Servers.all()),
        template = (process.env.NODE_ENV === 'production') ? 'Wu-prod' : 'Wu'; 

    if(!err && docs){
      lists = "var bootstrapPlaylists = " + JSON.stringify(docs);
    }else{
      lists = "var bootstrapPlaylists = [];"
    }

    res.render(template, { 
      title: 'Wu',
      playlists: lists,
      servers: servers,
      renderers: renderers
    });
  });
};

exports.renderer = function(req,res){
  res.render("Wu-renderer",{title: "renderer"})
}

var proxy = new httpProxy.RoutingProxy();
exports.proxy = function(req,res){
  var buffer = httpProxy.buffer(req),
      id = req.params.id;
      
  Tracks.urlById(id,function(err,doc){
    if(!err && doc){
      var server_url = url.parse(doc.Uri);
      req.url = server_url.pathname;

      proxy.proxyRequest(req, res, {
        host: server_url.hostname,
        port: server_url.port,
        buffer: buffer
      });
    }else{
      res.send(404);
    }
  })
}