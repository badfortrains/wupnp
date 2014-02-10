var Playlists = require('../models/playlist').playlist,
    Renderers = require('../models/renderer');

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
        offset = req.body.offset,
        renderer = Renderers.find(req.body.renderer),
        position;

    //clearAfter, changed to the index of
    //where the track should be added (aka current track)
    var addResult = function(err,count){
      if(err){
        res.send(500,err)
      }else{
        res.send({added:count, position: position});
      }
    }
    if(offset == 'undefined'){
      pl.add(filter,addResult);
    }
   else if(offset === 0 && renderer){
      position = renderer.quickListPosition()
      pl.removeAfter(renderer.quickListPosition(),function(err){
        if(err){
          addResult(err,0)
        }else{
          pl.add(filter,addResult);
        }
      })
    }else if(renderer){
      //addAt, adds at position + 1.  Need to account for that
      offset = offset - 1
      position = renderer.position 
      pl.addAt(filter,position + offset,addResult);
    }else{
      addResult("Error playing tracks, renderer not found")
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