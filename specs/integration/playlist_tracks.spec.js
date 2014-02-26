var request = require('request'),
    baseURL = "http://localhost:3000/api/playlists";

describe("#index",function(){
  it("returns an error for an undefined playlist",function(done){
    request(baseURL + "/10",function(err,res,body){
      expect(res.statusCode).toBe(404)
      done()
    })
  })
  it("returns a list of tracks",function(done){
    request(baseURL + "/1",function(err,res,body){
      data = JSON.parse(body)
      expect(data.length).toBeGreaterThan(0)
      for(var i=0;i<data.length;i++){
        expect(data[i]["Artist"]).toBeDefined();
        expect(data[i]["Album"]).toBeDefined();
        expect(data[i]["Title"]).toBeDefined();
        expect(data[i]["_id"]).toBeDefined();
        expect(data[i]["position"]).toBeDefined();
      }
      done()
    })
  });
})