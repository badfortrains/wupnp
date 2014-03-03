describe("Playlist",function(){
  var loadModule = require('./helpers/module-loader').loadModule;
  var Q = require("q");
  var mockDB = require('./mocks/mocks').db
  var test = require('../models/playlist_new')
  var Playlist = loadModule('./models/playlist_new.js',{"./db":mockDB}).Playlist

  describe("Constructor",function(){
    it("creates a new playlist when given a name",function(){
      spyOn(Playlist.prototype,"_create")
      var fakeCB = function(){}
      var pl = new Playlist({name:"test",cb:fakeCB})
      expect(pl.name).toBe("test")
      expect(Playlist.prototype._create).toHaveBeenCalledWith(fakeCB)
    })

    it("loads a playlist when given an id",function(){
      spyOn(Playlist.prototype,"_create")
      var pl = new Playlist({id:1})
      expect(pl.id).toBe(1)
      expect(Playlist.prototype._create).not.toHaveBeenCalled()
    })

    it("finds an exisiting playlist when given an existing uuid and a name",function(done){
      var fakeId = 1;
      spyOn(mockDB,"get").andCallFake(function(query,uuid,cb){
        cb(null,{_id:fakeId})
      })
      var pl = new Playlist({
        name:"testQuicklist",
        uuid:"123",
        cb: function(id,list){
          expect(list.name).toBe("testQuicklist")
          expect(list.uuid).toBe("123")
          expect(list.id).toBe(fakeId)
          done()
        }})
    })

    it("craetes a new playlist when given a new uuid and name",function(){
      spyOn(Playlist.prototype,"_create")
      spyOn(mockDB,"get").andCallFake(function(query,uuid,cb){
        cb(null,null)
      })
      var pl = new Playlist({name:"testQuicklist",uuid:"123"})
      expect(Playlist.prototype._create).toHaveBeenCalled()
    })
  })
  describe("#add",function(){
    beforeEach(function(){
      tracks = Q.fcall(function(){
        return [
          {_id:1},
          {_id:2},
          {_id:3}
        ]
      })
      pl = new Playlist({id:1})
    });

    it("returns a promise",function(){
      var results = pl.add(tracks)
      expect(typeof results.then).toBe("function")
    })

    it("fufills with the number of tracks inserted",function(done){
      pl.add(tracks,0)
      .done(function(count){
        expect(count).toBe(tracks.length)
        done()
      })
    })

    it("uses count for position if no position is given",function(done){
      var spy = spyOn(Playlist.prototype,"_getCount").andCallFake(function(){
        return Q.fcall(function(){
          return tracks.length
        })
      })
      pl.add(tracks).done(function(){
        expect(spy).toHaveBeenCalled()
        done();
      })
    })

    it("rejects if get count encounters an error",function(done){
      var fakeError = "bad count"
      spyOn(Playlist.prototype,"_getCount").andCallFake(function(){
        return Q.fcall(function(){
          throw fakeError
        })
      })
      pl.add(tracks).fail(function(error){
        expect(error).toEqual(fakeError)
        done()
      })
    })


  })

})