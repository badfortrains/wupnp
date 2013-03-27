var sqlite3 = require('sqlite3').verbose(),
    db = new sqlite3.Database(':memory:'),
    util = require("util"),
    EventEmitter = require("events").EventEmitter;

var Tracks = function(){}
util.inherits(Tracks,EventEmitter);

//Tracks.prototype.removeAll = function(cb){
  var TABLE = "CREATE TABLE IF NOT EXISTS tracks (_id INTEGER PRIMARY KEY,TrackNumber INTEGER, Title TEXT, Artist TEXT, Album TEXT, Didl TEXT, Resources TEXT)";
  db.run(TABLE,function(){
    db.run("DELETE FROM tracks");
  })
//}

Tracks.prototype.insert = function(data,cb){
  var i = 0,
      length = data.length,
      stmt = db.prepare("INSERT INTO tracks VALUES (NULL,?,?,?,?,?,?)"),
      item;

  for(;i<length;i++){
    item = data[i];
    stmt.run(item.TrackNumber,item.Title,item.Artist,item.Album,item.Didl,JSON.stringify(item.Resources))
  }

  stmt.finalize(cb);
}

Tracks.prototype.getCategory = function(category,filter,cb){
  var WHERE = filterToSQL(filter),
      statement;

  if(category !== 'Title'){
    statement = "SELECT DISTINCT "+category+" FROM tracks "+WHERE+" ORDER BY "+category;
  }else{
    statement = "SELECT Title,_id FROM tracks" + WHERE;
    if(filter.Album){
      statement += " ORDER_BY Album, TrackNumber" 
    }else{
      statement += " ORDER_BY Title" 
    }
  }
  console.log(statement);
  db.all(statement,cb);
}

var filterToSQL = function(filter){
  var where = "";
  if(typeof(filter) === 'object' && Object.keys(filter).length > 0){
    where = "WHERE "
    for(var column in filter){
      where += column + "='" + filter[column] + "' AND "; 
    }
    where = where.substring(0,where.length - 5);
  }
  return where;
}


function readAllRows() {
    console.log("readAllRows");
    db.all("SELECT * FROM tracks", function(err, rows) {
        console.log(err);
        rows.forEach(function (row) {
            console.log(row);
        });
    });
}

var tracks = new Tracks();
module.exports = tracks;
