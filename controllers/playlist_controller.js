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
        pl = new Playlists(id);
    pl.add(filter,function(err,count){
      res.send({err:err,added:count});
    })
  }
}