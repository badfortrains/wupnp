var request = require('request'),
    baseURL = "http://localhost:3000/api/renderers";

describe("#show",function(){
  it("returns 404 for renderer not found",function(done){
    var id = "fakeRenderer"
    request({
      url: baseURL+"/"+id
    },function(err,res,body){
      //404 content not found 
      expect(res.statusCode).toBe(404)
      done()
    })
  });
});