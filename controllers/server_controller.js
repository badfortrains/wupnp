var servers = require('../models/servers.js');

module.exports = {
  show:function(req,res){
    var uuid = req.params.id,
        server = servers.find(uuid);

    if(!server){
      res.send(500,"server not found");
    }else{
      res.send(server);
    }
  },
  index:function(req,res){
    res.send(servers.all());
  },
  browse: function(req,res){
    servers.browse(req.params.ms,req.params.id,function(dir){
      if(dir)
        res.send({docs:dir});
      else
        res.send(500,"Failed to get directory");
    });
  }
}