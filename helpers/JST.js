var blade = require('blade')
    ,path = require('path')
    ,fs = require('fs');

function getExtension(filename) {
    var ext = path.extname(filename||'').split('.');
    return ext[ext.length - 1];
}

exports.render = function(callback){
  var completed = 0
      ,numberFiles = 0
      ,result = "window.JST = {";
  var _afterCompile = function(err,template){
    if(err){
      console.log(err);
      callback('');
    }else{
      if(result != "window.JST = {")
        result += ","

      result += template.toString().replace("function anonymous","'"+this+"':function");
      completed++;
      console.log("numCompleted",completed);
      console.log("numFiles",numberFiles)
      if(numberFiles === completed){
        result += "}"
        callback(result)
      }
    }

  }

  var after = function(filename){
    var templateName = filename.replace("." + getExtension(filename),"");
    console.log(templateName)
    return _afterCompile.bind(templateName);
  }

  var cb = callback;
  fs.readdir('templates',function(err,files){
    if(err){
      console.log(err);
      return callback(err,null);
    }else{
      console.log("Got files");
      console.log(files)
      files.forEach(function(file){
        if(getExtension(file) == 'blade'){
          numberFiles++;
        }
      });
      files.forEach(function(file){
        if(getExtension(file) == 'blade'){
          blade.compileFile("templates/"+file,after(file));
        }
      })
      if(numberFiles === 0){
        callback("");
      }
    }
  })
}