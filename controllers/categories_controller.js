var Tracks = require('../models/tracks.js');

var parseFilter = function(req){
  var filter = req.query.filter || {};
  try{
    filter = JSON.parse(filter);
  }catch(err){
    console.log("BAD JSON");
    filter = {};
  }
  return filter;
}

module.exports = {
  //category/:id
  show: function(req, res){
    var filter = parseFilter(req);
    Tracks.distinct(req.params.category,filter,function(err,docs){
      res.send({err:err,docs:docs});
    })
  }
}