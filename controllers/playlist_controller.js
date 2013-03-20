var Playlists = require('../models/playlist').playlist,
    db = require('mongojs').connect('test');

module.exports = {
  index: function(req,res){
    var filter = req.query.filter || {};
    Playlists.prototype.findList(filter,{name:1},function(err,docs){
      if(!err)
        res.send(docs);
      else
        res.send({err:err});
    });
  },
  new: function(req,res){
    var filter = req.body.filter,
        name = req.body.name,
        pl = new Playlists(name),
        id = pl.id;

    if(filter){
      pl.add(filter,function(err,count){
        res.send({_id:id,added:count});
      });
    }else{
      res.send({_id:id,added:0});
    }
  },
  add: function(req,res){
    var filter = req.body.filter || {},
        id = req.params.id,
        pl = new Playlists(id),
        clearAfter = req.body.clearAfter;

    if(typeof(filter._id) === 'string'){
      filter._id = db.bson.ObjectID(filter._id)
    }

    var addTracks  = function(){
      pl.add(filter,function(err,count){
        res.send({err:err,added:count});
      })
    };

    if(typeof(clearAfter) != 'undefined'){
      pl.removeAfter(clearAfter,addTracks);
    }else{
      addTracks();
    }
  }
}