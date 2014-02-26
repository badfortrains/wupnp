var request = require('request'),
    baseURL = "http://localhost:3000/api/playlists";

describe("#index",function(){
  it("returns an error for a bad filter",function(done){
    request({
      url: baseURL,
      qs: {filter: {"bad":{test:1}}}
    },function(err,res,body){
      //422 Unprocessable Entity
      expect(res.statusCode).toBe(422)
      done()
    })
  });
  it("returns a list of playlists objects",function(done){
    request(baseURL,function(err,res,body){
      data = JSON.parse(body)
      expect(data.length).toBeGreaterThan(0)
      for(var i=0;i<data.length;i++){
        expect(data[i]["_id"]).toBeDefined();
        expect(data[i]["name"]).toBeDefined();
        expect(data[i]["count"]).toBeDefined();
        expect(data[i]["uuid"]).toBeDefined();
      }
      done()
    })
  });
});