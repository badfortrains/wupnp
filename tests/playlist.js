var db = require('mongojs').connect('test', ['tracks','playlist','lists']),
    assert = require('assert'),
    playlist = require('../models/playlist').playlist;

module.exports = {
  setUp: function(callback){
    this.ids = [
      {playlist: db.bson.ObjectID(), position: 1},
      {playlist: db.bson.ObjectID(), position: 2},
      {playlist: db.bson.ObjectID(), position: 5}
    ]
    this.testTracks = [
      {Artist : "test1", playlist : [this.ids[0],this.ids[1]],testTrack :true},
      {Artist : "test1", playlist : this.ids,testTrack :true},
      {Artist : "test2", playlist : [this.ids[1]],testTrack :true},
      {Artist : "test3", playlist : [this.ids[0]],testTrack :true}
    ]
    db.lists.insert({name:'playlist1',count: 0,testList:true,_id:this.ids[0]});
    db.tracks.insert(this.testTracks,{safe:true},callback);
  },
  tearDown: function(callback){
    db.lists.remove({testList:true},function(){
      db.tracks.remove({testTrack : true},callback);
    });
    
  },
  playlistAddAll: function(test){
    var self = this
        ,pl = new playlist("someTest")
        ,id = pl.id

    db.lists.update({_id:id},{testList:true});
    numberTracks = self.testTracks.length;
    pl.add({testTrack:true},function(){
      db.tracks.find({testTrack:true,playlist:id},function(err,docs){
        test.equals(docs.length,numberTracks);
        test.done()
      })
    });
    db.lists.insert({name:"test",count:0,_id:db.bson.ObjectID()});
  },
  playlistAddSome: function(test){
    var pl = new playlist("someTest")
        ,id = pl.id;

    db.lists.update({_id:id},{testList:true});
    pl.add({Artist:"test1"},function(){
      db.tracks.find({testTrack:true,playlist:id},function(err,docs){
        numberTracks = docs.length;
        db.tracks.find({testTrack:true,Artist:"test1"},function(err,docs){
          test.equals(docs.length,numberTracks);
          test.done();
        })
      })
    });  
  },
  playlistRemoveAll: function(test){
    var id = this.ids[0].playlist,
        pl = new playlist(id);
    pl.remove({},function(){
      db.tracks.find({testTrack:true,'playlist.playlist':id},function(err,docs){
        test.equals(docs.length,0);
        test.done();
      })
    })
  },
  playlistRemoveSome: function(test){
    var id = this.ids[0].playlist,
        pl = new playlist(id);
    pl.remove({Artist: "test1"},function(){
      db.tracks.find({Artist: "test1", 'playlist.playlist':id},function(err,docs){
        test.equals(docs.length,0);
        test.done();
      })
    })
  },
  playlistDrop:function(test){
    var id = this.ids[0].playlist,
        pl = new playlist(id);
    pl.drop(function(){
      db.lists.find({_id:id,testList:true},function(err,docs){
        test.equals(0,docs.length);
        test.done();
      })
    })
  },
  playlistCursor:function(test){
    var id = this.ids[0].playlist,
        pl = new playlist(id);

    pl.find({testTrack:true}).limit(1,function(err,docs){
      test.equals(1,docs.length);
      test.done();
    });
  }
}