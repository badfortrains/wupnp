var db = {
  run: function(){
    //pretend we ran any command give, and call
    //cb right away
    var cb = arguments[arguments.length-1]
    typeof cb == "function" && cb(null,{})
  },
  get: function(){},
  serialize:function(cb){
    cb(null)
  },
  prepare:function(){
    return this
  }
}

var renderer = {
  find: function(){}
}

var playlist = {
  add: function(){}
}

module.exports ={
  db: db,
  renderer: renderer,
  playlist: playlist
}