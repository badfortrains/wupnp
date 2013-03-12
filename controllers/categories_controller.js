var Tracks = require('../models/tracks.js'),
    Servers = require('../models/servers.js'),
    crypto = require('crypto');

module.exports = {
  //category/:id
  show: function(req, res){
    var filter = req.query.filter || {}
        ,category = req.params.category,
        etag = req.url + Servers.lastUpdated;

    if(req.get('If-None-Match') === etag){
      res.send(304)
      return;
    }else{
      res.set('ETag',etag);
    }

    if(category !== 'Title'){
      Tracks.distinct(category,filter,function(err,docs){
        if(docs && !err){
          res.send({err:null,docs:docs.sort()});
        }else{
          res.send({err:err,docs:null});
        }
          
      })      
    }else if(!filter.Album){
      Tracks.find(filter,{Title:1}).sort({Title:1},function(err,docs){
          res.send({err:err,docs:docs});
      })   
    }else{
      Tracks.find(filter,{Title:1}).sort({Album:1,TrackNumber:1},function(err,docs){
          res.send({err:err,docs:docs});
      })   
    }
  }
}