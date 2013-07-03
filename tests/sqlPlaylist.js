
var sqlite3 = (process.env.NODE_ENV == "development") ? require('sqlite3').verbose() : require('sqlite3'),
    db = new sqlite3.Database('/tmp/db'),
    assert = require('assert'),
    playlist = require('../models/playlist').playlist
    //_ = require('underscore');

module.exports = {
  setUp: function(callback){
    this.p1 = new playlist("testid","aUniqueUUID",function(){
      callback()
    })
  },
  tearDown: function(callback){
    this.p1.drop(callback)
  },

  countIsZero: function(test){
    this.p1.getCount(function(err,count){
      test.equal(count,0,"count is initally zero")
      test.done()
    })
  },

  countReturnsErrorIfNoPlaylist: function(test){
    var p2 = new playlist(120012) //create  a playlist with a fake bad id
    p2.getCount(function(err,count){
      test.ok(err,"getting count from fake playlist returns error")
      test.done()
    });
  }
}
