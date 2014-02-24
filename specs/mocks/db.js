module.exports ={
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