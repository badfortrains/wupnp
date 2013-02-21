var Tracks = require('../models/tracks.js');


module.exports = {
  //category/:id
  show: function(req, res){
    var filter = req.query.filter || {}
        ,category = req.params.category;

    if(category !== 'Title'){
      Tracks.distinct(category,filter,function(err,docs){
        if(docs){
          res.send({err:err,docs:docs.sort()});
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