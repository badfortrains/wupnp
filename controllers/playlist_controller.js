var Playlists = require('../models/playlist').playlist;

module.exports = {
  //playlist/:id
  show: function(req, res){
    var id = req.params.id,
        pl = new Playlists(id);

    pl.attributes(function(err,doc){
      if(!err && doc[0])
        res.send(doc[0])
      else
        res.send({err:err})
    })
  },
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
        res.send({id:id,added:count});
      });
    }else{
      res.send({id:id,added:0});
    }
  },
  add: function(req,res){
    var filter = req.body.filter || {},
        id = req.params.id,
        pl = new Playlists(id),
        clear = req.body.clearFirst;

    var addTracks  = function(){
      pl.add(filter,function(err,count){
        res.send({err:err,added:count});
      })
    };

    console.log("IN ADD")
    if(clear){
      console.log("REMOVE THE TRACKS")
      pl.remove({},addTracks);
    }else{
      addTracks();
    }

  },
  showTracks:function(req,res){
    var id = req.params.id,
        pl = new Playlists(id),
        categories = {
          Artist: 1,
          Album:  1,
          Title:  1
        };

    pl.findAt(1,{limit:false, categories:categories},function(err,docs){
      if(err)
        res.send(500,"failed to retrieve tracks");
      else
        res.send(docs);
    });
  }
}