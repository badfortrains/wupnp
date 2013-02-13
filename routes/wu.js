var Playlists = require('../models/playlist').playlist;
exports.index = function(req, res){
  Playlists.prototype.findList({},{name:1},function(err,docs){
    var lists = "";
    if(!err && docs){
      lists = "var bootstrapPlaylists = " + JSON.stringify(docs);
    }else{
      lists = "var bootstrapPlaylists = [];"
    }
    res.render('Wu', { 
      title: 'Wu',
      playlists: lists
    });
  });
};