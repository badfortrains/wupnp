var Playlists = require('../models/playlist').playlist,
    db = require('mongojs').connect('test');

module.exports = {
  //playlist/:id
  /*
  show: function(req, res){
    var id = req.params.id,
        pl = new Playlists(id);

    pl.attributes(function(err,doc){
      if(!err && doc)
        res.send(doc[0])
      else
        res.send({err:err})
    })
  },*/
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
        clear = req.body.clearFirst;

    if(typeof(filter._id) === 'string'){
      filter._id = db.bson.ObjectID(filter._id)
    }

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
  show:function(req,res){
    var id = req.params.id,
        pl = new Playlists(id),
        categories = {
          Artist: 1,
          Album:  1,
          Title:  1
        };

    pl.attributes(function(err,attributes){
      if(err || !attributes){
        res.send(500,"error finding playlist")
        return;
      }
      pl.findAt(1,{limit:false, categories:categories},function(err,docs){
        if(err){
          res.send(500,"failed to retrieve tracks");
        }else{
          console.log("DOCS =",docs)
          attributes.docs = docs;
          console.log(attributes);
          res.send(attributes);
        }
      });
    })
  }
}