var lists = require('../models.js')

var TITLE_MAP = {
  Album: "Artist",
  Title: "Album"
}

var flatten = function(list){
  function extend (a, b) { for (var x in b) a[x] = b[x] }
  var result = {};
  list.forEach(function(item){
    extend(result,item);
  });
  return result;
}

var showTracks = function(req,res,id,filter,title){
  var category,
      sort;

  try{
    category = (req.query.category) ? JSON.parse(req.query.category) : {Title:1, _id:1};
    //sort alphabetically by category if no sort order supplied
    sort = (req.query.sort) ? JSON.parse(req.query.sort) : {};
  }catch(err){
    console.log("bad json "+err)
    res.send("BAD JSON:" +err );
    return;
  }

  lists.getList(id,category,filter,sort,function(data){
    res.render('track',{list:data, title:title},function(err,data){
      res.send({
        filter:filter,
        content:data})
    });
  })
}

var show = function(req,res,id,filter,title){
  var category,
      reverse,

  category = (req.query.category) ? req.query.category : 'Artist';
  //sort alphabetically by category if no sort order supplied
  reverse = (req.query.sort == "true") ? true : false;
  lists.distinctList(id,category,filter,reverse,function(data){
    res.render('category',{list:data, title:title},function(err,data){
      res.send({
        filter:filter,
        content:data
      })
    });
  }) 
}

exports.show = function(req,res){
  var id,
      filter,
      title=false;

  id = (req.query.id) ? req.query.id : false;
  try{
    filter = (req.query.filter) ? JSON.parse(req.query.filter) : [];
  }catch(err){
    console.log("bad json "+err)
    res.send("BAD JSON:" +err );
    return;
  }
  if(filter.length > 0){
    var key = Object.keys(filter[filter.length -1])[0];
    title = filter[filter.length -1][key];
  }
  filter = flatten(filter);

  if(req.query.type === 'track')
    showTracks(req,res,id,filter,title);
  else
    show(req,res,id,filter,title);
}
