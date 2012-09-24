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

var showTracks = function(req,res,params){
  var category,
      sort;

  try{
    category = (req.query.category) ? JSON.parse(req.query.category) : {Title:1, _id:1};
  }catch(err){
    console.log("bad json "+err)
    res.send("BAD JSON:" +err );
    return;
  }

  lists.getList(params.id,category,params.filter,params.sort,function(data){
    res.render('track',{list:data, title:params.title},function(err,data){
      res.send({
        filter:params.filter,
        content:data})
    });
  })
}

var show = function(req,res,params){
  var category,
      reverse,

  category = (req.query.category) ? req.query.category : 'Artist';
  //sort alphabetically by category if no sort order supplied
  reverse = (req.query.reverse == "true") ? true : false;
  lists.distinctList(params.id,category,params.filter,reverse,function(data){
    res.render('category',{list:data, title:params.title},function(err,data){
      res.send({
        filter:params.filter,
        content:data
      })
    });
  }) 
}

var parse = function(req){
  var result = {};
  result.id = (req.query.id) ? req.query.id : false;
  var filter;
  try{
    filter = (req.query.filter) ? JSON.parse(req.query.filter) : [];
    result.sort = (req.query.sort) ? JSON.parse(req.query.sort) : {};
  }catch(err){
    return {error: "Bad Json string given for filter"};
  }
  if(filter.length > 0){
    var key = Object.keys(filter[filter.length -1])[0];
    result.title = filter[filter.length -1][key];
  }
  result.filter = flatten(filter);
  return result;
}

exports.show = function(req,res){
  var id,
      filter,
      title=false;
      params = parse(req);

  if(params.error){
    console.log(error);
    return;
  }
  if(req.query.type === 'track')
    showTracks(req,res,params);
  else
    show(req,res,params);
}
exports.playlist = function(req,res){
  var params = parse(req);
  //-1 position = add to end;
  var position = (req.query.position) ? parseInt(req.query.position,10) : -1; 
  if(req.query.action == 'add'){
    lists.playlist.add(params.id,req.query.dest_id,position,params.filter,params.sort,function(count){
      res.send({toast: count +" tracks added"});
    })
  }
  else if(req.query.action == 'create'){
    lists.lists.add(req.query.name,function(new_list){
      lists.playlist.add(params.id,new_list._id,position,params.filter,params.sort,function(count){
        res.send({toast: count +" tracks added"});
      })
    })
  }
}

exports.menu = function(req,res){
  lists.lists.show({},function(data){
    res.render('menu',{list:data});
  });
}

exports.lists = function(req,res){
  //lists.playlist.add(1,0,{Artist:"Future Islands"},{},function(data){console.log("after add"+data)});
  if(req.query.action == 'list'){
    lists.lists.show({},function(data){
      res.send(data);
    })
  }else if(req.query.action == 'add'){
    lists.lists.add(req.query.name,function(data){
      res.send(data);
    });
  }
}
