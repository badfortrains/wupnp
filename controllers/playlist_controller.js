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
        clearAfter = req.body.clearAfter,
        position = req.body.position

    //clearAfter, changed to the index of
    //where the track should be added (aka current track)
    var addResult = function(err,count){
      res.send({err:err,added:count});
    }

    if(clearAfter && typeof(position) != 'undefined'){
      pl.removeAfter(position,function(err){
        if(err){
          addResult(err,0)
        }else{
          pl.add(filter,addResult);
        }
      })
    }else if(typeof(position) != 'undefined'){
      pl.addAt(filter,position,addResult);
    }else{
      pl.add(filter,addResult);
    }
  },
  remove: function(req,res){
    var id = parseFloat(req.params.id),
        pl = new Playlists(id);

    pl.drop(function(err,doc){
      if(err){
        res.send(500,"error deleting playlist");
      }else{
        res.send(200,{deleted: true});
      }
    });     
  }
}