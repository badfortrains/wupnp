var Playlists = require('../models/playlist').playlist;

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
        name = req.body.name;
        
    var pl = new Playlists(name,function(id){
      if(filter){
        pl.add(filter,function(err,count){
          res.send({_id:id,added:count});
        });
      }else{
        res.send({_id:id,added:0});
      }
    });
  },
  add: function(req,res){
    var filter = req.body.filter || {},
        id = parseFloat(req.params.id),
        pl = new Playlists(id),
        clearAfter = req.body.clearAfter;

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