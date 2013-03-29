var Tracks = require('../models/tracks.js'),
    crypto = require('crypto');

module.exports = {
  //category/:id
  show: function(req, res){
    var filter = req.query.filter || {}
        ,category = req.params.category,
        etag = req.url + Tracks.lastUpdated;

    if(req.get('If-None-Match') === etag){
      res.send(304)
      return;
    }else{
      res.set('ETag',etag);
    }

    Tracks.getCategory(category,filter,function(err,docs){
      res.send({docs:docs});
    }.bind(this));
  }
}