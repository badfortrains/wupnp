var Playlists = require('../models/playlist').playlist,
    Renderes = require('../models/renderer'),
    Servers = require('../models/servers')

exports.index = function(req, res){
  Playlists.prototype.findList({},{name:1},function(err,docs){
    var lists = "",
        renderers = "var bootstrapRenderers =" + JSON.stringify(Renderes.all()),
        servers = "var bootstrapServers =" + JSON.stringify(Servers.all()),
        template = (process.env.NODE_ENV === 'production') ? 'Wu-prod' : 'Wu'; 

    console.log(process.env.NODE_ENV)
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