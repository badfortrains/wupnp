describe("Renderer Controller",function(){
  var loadModule = require('./helpers/module-loader').loadModule;
  var mockRenderer = require('./mocks/mocks').renderer
  var mockPlaylist = require('./mocks/mocks').playlist
  var controller = loadModule("./controllers/renderer_controller.js",{"../models/renderer":mockRenderer}).module.exports

  describe("#_find_renderer middleware",function(){
    beforeEach(function(){
      rendererId = "rendererId"
      send = jasmine.createSpy();
      next = jasmine.createSpy();
      req = {
        params: {id:rendererId}
      }
      res = {
        send: send
      }
    })

    it("send a 404 for renderer not found",function(){
      spyOn(mockRenderer,"find").andReturn(null)

      controller._find_renderer(req,res,next)

      expect(send).toHaveBeenCalledWith(404,"Renderer not found");
      expect(next).not.toHaveBeenCalled();

    })
    it("sets req.renderer for renderer found",function(){
      var rendererObj = {id:rendererId};

      spyOn(mockRenderer,"find").andReturn(rendererObj)

      controller._find_renderer(req,res,next)

      expect(send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();   
      expect(req.renderer).toEqual(rendererObj) 
    })
  })
})