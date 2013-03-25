Wu = {
  Views: {},
  Models: {},
  Collections: {},
  Cache: {
    Models: {},
    Views: {},
    Collections: {}
  },
  Routers: {},
  init: function(){
    window.Socket = io.connect(':3000');
    this.Cache.Models.category = new Wu.Models.category();
    this.Cache.Models.directory  = new Wu.Models.directory();
    this.Cache.Models.player = new Wu.Models.player();
    this.Cache.Collections.renderers = new Wu.Collections.renderers();
    Wu.Cache.Categories = new Wu.Routers.Categories();
    Wu.Cache.Collections.playlists = new Wu.Collections.playlists();
    Wu.Cache.Collections.servers  = new Wu.Collections.servers();

    Wu.Cache.Views.toastMaster = new Wu.Views.toastMaster();
    
    this.Cache.Collections.servers.reset(bootstrapServers);
    this.Cache.Collections.renderers.reset(bootstrapRenderers);
    this.Cache.Collections.playlists.reset(bootstrapPlaylists);

    $(document).on("click","a:not(.data-bypass)",function(e){
      e.preventDefault();
      Backbone.history.navigate($(e.target).attr('href'),{trigger:true});
    })

    $(document).on("swipeRight",".category",function(){
      window.history.back();
    })

    Wu.Layout.init();
    Backbone.history.start({pushState: true});

  }
}

$(document).ready(function(){
  window.Wu = Wu;
  Wu.init();
});var Drawer = (function(){
  var options = {
      maxTime: 1000,
      maxDistance: 20,
      scopeEl: $("html"),
      xPadding: 0,
      yPadding: 0,
      drag:"horizontal"
      //must supply an options.el 
    },
    startPos = 0,
    startTime = 0,
    preventScroll = false,
    scrollLock = false,
    touch = "ontouchend" in document,
    startEvent = (touch) ? 'touchstart' : 'mousedown',
    moveEvent = (touch) ? 'touchmove' : 'mousemove',
    endEvent = (touch) ? 'touchend' : 'mouseup',
    yCutOff,
    xCutOff,
    yPad,
    xPad,
    $el,
    position,
    enabled = true;

  function yPos(e){
    return e.touches ? e.touches[0].pageY : e.pageY;
  }
  function xPos(e){
    return e.touches ? e.touches[0].pageX : e.pageX
  }

  function start(e){        
    var x = e.touches ? e.touches[0].pageX : e.pageX,
        y = e.touches ? e.touches[0].pageY : e.pageY,
        xDif = x - $el.offset().left,
        yDif = y - $el.offset().top;
    if(!enabled)
      return;

    if( yDif > yPad && yDif < yCutOff  && xDif < xCutOff && xDif > xPad){
      //e.preventDefault();
      startTime = e.timeStamp;
      if(options.drag == "horizontal")
        startPos = x;
      else
        startPos = y;
      preventScroll = true;
    }
  };
  function move(e){
    if(preventScroll){
      e.preventDefault();
      var currentPos = position(e),
          currentDistance = (startPos === 0) ? 0 : Math.abs(currentPos - startPos),
          maxTime = options.maxTime,
          maxDistance = options.maxDistance;
          // allow if movement < 1 sec
          currentTime = e.timeStamp;
      
      if (startTime !== 0 && currentTime - startTime < maxTime && currentDistance > maxDistance) {
        if (currentPos < startPos) {
          var dir = (options.drag == 'horizontal') ? 'left' : 'up';
          $el.trigger(dir);
          //swipe up
        }
        if (currentPos > startPos) {
          var dir = (options.drag == 'horizontal') ? 'right' : 'down';
          $el.trigger(dir);
          preventScroll = false;

          //swipe down
        }
        startTime = 0;
        startPos = 0;   
      }
    }else if(scrollLock == 'full'){
      e.preventDefault();
    }else if(scrollLock == 'partial'){
      if(!e.overide){
        e.preventDefault();
      }
    }
  }
  function end(e){
    startTime = 0;
    startPos = 0;
    preventScroll = false;
  }
  return{
    init: function(settings){
      $.extend(options,settings);
      $el = $(options.el);
      if(!$el || $el.length < 1)
        throw "Error: Need to supply a valid target element";
      yPad = options.yPadding;
      xPad = options.xPadding;
      xCutOff = $el.width() + xPad;
      yCutOff = $el.height() + yPad;
      options.scopeEl.on(startEvent,start)
        .on(moveEvent,move)
        .on(endEvent,end);
      position = (options.drag == 'horizontal') ? xPos : yPos;
      $(".nots").bind(moveEvent,function(e){
        e.xyz = true;
      });
      $el.on("toggleDrag",function(e,set){
        enabled = (set === undefined) ? !enabled : set;
      });
    },
    //open = true: open
    //open = false: close
    toggle: function(open){
      preventScroll = open;
    },
    lockScroll: function(lock){
      scrollLock = lock;
    }
  };
})();;Wu.Layout = {
  init: function(){
    this.header = new Wu.Views.header({
      el: $("#header")
    });

    this.menu = new Wu.Views.menu({
      collection: Wu.Cache.Collections.renderers,
      el: $("#menu")
    }).render();
    this.menu.trigger('inserted');

    this.footer = new Wu.Views.playerTab({
      model: Wu.Cache.Models.player,
      el:$("#pullTab")
    }).render();
    this.footer.trigger("inserted");

  },
  setSubHeader : function(view){
    this.header.setSubHeader(view);
    this.header.render();
  },
  removeSubHeader : function(){
    this.header.removeSubHeader();
  },
  setPage: function(view){
    this.page && this.page.unrender();
    this.menu.hide();
    $("#mask").hide();
    $("#page").html(view.render().$el);
    view.trigger('inserted');
    this.page = view;
  }
};/** Blade Run-time helper functions
	(c) Copyright 2012-2013. Blake Miner. All rights reserved.	
	https://github.com/bminer/node-blade
	http://www.blakeminer.com/
	
	See the full license here:
		https://raw.github.com/bminer/node-blade/master/LICENSE.txt
*/
(function(triggerFunction) {
	var runtime = typeof exports == "object" ? exports : {},
		cachedViews = {},
		eventHandlers = {},
		/* Add blade.LiveUpdate no-op functions */
		htmlNoOp = function(arg1, html) {return html;},
		funcNoOp = function(func) {return func();},
		funcNoOp2 = function(arg1, func) {return func();},
		liveUpdate = {
			"attachEvents": htmlNoOp,
			"setDataContext": htmlNoOp,
			"isolate": funcNoOp,
			"render": funcNoOp,
			"list": function(cursor, itemFunc, elseFunc) {
				var itemList = [];
				//cursor must have an observe method
				//Let's go ahead and observe it...
				cursor.observe({
					"added": function(item) {
						//added must be called once per element before the
						//`observe` call completes
						itemList.push(item);
					}
				}).stop(); //and then stop observing it.
				if(!itemList.length) //If itemList.length is null, zero, etc.
					return elseFunc();
				//Otherwise, call itemFunc for each item in itemList array
				var html = "";
				for(var i = 0; i < itemList.length; i++)
					html += itemFunc(itemList[i]);
				return html;
			},
			"labelBranch": funcNoOp2,
			"createLandmark": funcNoOp2,
			"finalize": htmlNoOp //should do nothing and return nothing meaningful
		};
	/* blade.Runtime.mount is the URL where the Blade middleware is mounted (or where
		compiled templates can be downloaded)
	*/
	runtime.options = {
		'mount': '/views/', 'loadTimeout': 15000
	};
	/* Expose Blade runtime via window.blade, if we are running on the browser
		blade.Runtime is the Blade runtime
		blade.runtime was kept for backward compatibility (but is now deprecated)
		blade._cachedViews is an Object of cached views, indexed by filename
		blade._cb contains a callback function to be called when a view is
			loaded, indexed by filename. The callback function also has a 'cb'
			property that contains an array of callbacks to be called once all
			of the view's dependencies have been loaded.
	*/
	if(runtime.client = typeof window != "undefined")
		window.blade = {'Runtime': runtime, 'LiveUpdate': liveUpdate,
			'_cachedViews': cachedViews, '_cb': {}, 'runtime': runtime};
	
	/* Convert special characters to HTML entities.
		This function performs replacements similar to PHP's ubiquitous
		htmlspecialchars function. The main difference here is that HTML
		entities are not re-escaped; for example, "<Copyright &copy; 2012>"
		will be escaped to: "&lt;Copyright &copy; 2012&gt;" instead of
		"&lt;Copyright &amp;copy; 2012&gt;"
		
		See: http://php.net/manual/en/function.htmlspecialchars.php
	*/
	runtime.escape = function(str) {
		return str == null ? "" : new String(str)
			/* The regular expression below will match &, except when & is
				followed by a named entity and semicolon. This is included
				below to help understand how the next regular expression
				works. */
			//.replace(/&(?![a-zA-Z]+;)/g, '&amp;')
			
			/* The following regular expression will match &, except when & is
				followed by a named entity, a decimal-encoded numeric entity,
				or a hexidecimal-encoded entity. */
			.replace(/&(?!([a-zA-Z]+|(#[0-9]+)|(#[xX][0-9a-fA-F]+));)/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}
	
	/* This is a helper function that generates tag attributes and adds	them
		to the buffer.
		
		attrs is an object of the following format:
		{
			"v": attribute_value,
			"e": escape_flag,
			"a": additional_classes_to_be_appended
		}
	*/
	runtime.attrs = function(attrs, buf) {
		for(var i in attrs)
		{
			var attr = attrs[i];
			//If the attribute value is null...
			if(attr.v == null || attr.v === false)
			{
				if(attr.a == null)
					continue; //Typically, we ignore attributes with null values
				else
				{
					//If we need to append stuff, just swap value and append
					attr.v = attr.a;
					delete attr.a;
				}
			}
			if(attr.v === true)
				attr.v = i;
			//Class attributes may be passed an Array or have classes that need to be appended
			if(i == "class")
			{
				if(attr.v instanceof Array)
					attr.v = attr.v.join(" ");
				if(attr.a)
					attr.v = (attr.v.length > 0 ? attr.v + " " : "") + attr.a;
			}
			//Add the attribute to the buffer
			if(attr.e)
				buf.push(" " + i + "=\"" + runtime.escape(attr.v) + "\"");
			else
				buf.push(" " + i + "=\"" + attr.v + "\"");
		}
	}
	
	runtime.ueid = runtime.client ? 1000 : 0; //unique element ID
	/* Injects the event handler into the view as a comment and also stores
		it in eventHandlers.  When done() is called, the eventHandlers will
		be moved to buf.eventHandlers, so they can be accessed from the
		render callback function.
		
		- events - a space-delimited string of event types (i.e. "click change")
		- elementID - the "id" attribute of the element to which an event handler is to
			be bound
		- eventHandler - the event handler
		- buf - the Blade template buffer
		- commentExists - false if and only if this is the first call to runtime.bind
			for this element
	*/
	runtime.bind = function(events, elementID, eventHandler, buf, commentExists) {
		/* Place event map into `eventHandlers` global.
			Examples of event maps:
				// Fires when any element is clicked
				"click": function (event) { ... }
				//Fires when an element with class "accept" is clicked, or when a key is pressed
				"keydown, click .accept": function (event) { ... }
				//Fires when an element with class "accept" is either clicked or changed
				"click .accept, change .accept": function (event) { ... }
			
			See http://docs.meteor.com/#eventmaps for more information
		*/
		var eventMapKey = "";
		var eventTypes = events.split(" ");
		for(var i = 0; i < eventTypes.length; i++)
			eventMapKey = "," + eventTypes[i] + " #" + elementID;
		eventHandlers[eventMapKey.substr(1)] = eventHandler;
		var comment = "i[" + JSON.stringify(events) + "]=" + eventHandler.toString();
		//If other event handlers were already declared for this element,
		//merge this one with the existing comment
		if(commentExists)
		{
			var i = buf.length - 1;
			buf[i] = buf[i].substr(0, buf[i].length-3) + ";" + comment + "-->";
		}
		else
			buf.push("<!--" + comment + "-->");
	};
	//runtime.trigger is defined below because it contains an eval()
	runtime.trigger = triggerFunction;
	
	/* Load a compiled template, synchronously, if possible.
	
		loadTemplate(baseDir, filename, [compileOptions,] cb)
		or
		loadTemplate(filename, [compileOptions,] cb)
		
		Returns true if the file was loaded synchronously; false, if it could not be
		loaded synchronously.
		
		The .blade file extension is appended to the filename automatically if no
		file extension is provided.
	
		Default behavior in Node.JS is to synchronously compile the file using Blade.
		Default behavior in the browser is to load from the browser's cache, if
		possible; otherwise, the template is loaded asynchronously via a script tag.
	*/
	runtime.loadTemplate = function(baseDir, filename, compileOptions, cb) {
		//Reorganize arguments
		if(typeof compileOptions == "function")
		{
			cb = compileOptions;
			if(typeof filename == "object")
				compileOptions = filename, filename = baseDir, baseDir = "";
			else
				compileOptions = null;
		}
		if(typeof filename == "function")
			cb = filename, filename = baseDir, compileOptions = null, baseDir = "";
		//Arguments are now in the right place
		//Append .blade for filenames without an extension
		if(filename.split("/").pop().indexOf(".") < 0)
			filename += ".blade";
		//Now, load the template
		if(runtime.client)
		{
			filename = runtime.resolve(filename);
			if(cachedViews[filename])
			{
				cb(null, cachedViews[filename]);
				return true;
			}
			var blade = window.blade;
			//If the file is already loading...
			if(blade._cb[filename])
				blade._cb[filename].cb.push(cb); //push to the array of callbacks
			else
			{
				//Otherwise, start loading it by creating a script tag
				var st = document.createElement('script');
				st.type = 'text/javascript'; //use text/javascript because of IE
				st.async = true;
				st.src = runtime.options.mount + filename;
				//Add compile options to the query string of the URL, if given
				//(this functionality is disabled for now since the middleware ignores it anyway)
				/*if(compileOptions)
				{
					var opts = "";
					for(var key in compileOptions)
						opts += "&" + key + "=" + encodeURIComponent(compileOptions[key]);
					st.src += "?" + opts.substr(1);
				}*/
				/* Helper function for runtime.loadTemplate that calls all of the callbacks
					in the specified array
					- cbArray contains all of the callbacks that need to be called
					- err is the error to be passed to the callbacks
				*/
				function callCallbacks(cbArray, err) {
					//call all callbacks
					for(var i = 0; i < cbArray.length; i++)
					{
						if(err)
							cbArray[i](err);
						else
							cbArray[i](null, cachedViews[filename]);
					}
				}
				//Function to be called if the template could not be loaded
				function errorFunction(reason) {
					var cb = blade._cb[filename].cb; //array of callbacks
					delete blade._cb[filename];
					st.parentNode.removeChild(st);
					callCallbacks(cb, new Error("Blade Template [" + filename +
						"] could not be loaded: " + (reason ? reason : "Request timed out") ) );
				}
				//Set a timer to return an Error after a timeout expires.
				var timer = setTimeout(errorFunction, runtime.options.loadTimeout);
				//Setup a callback to be called if the template is loaded successfully
				var tmp = blade._cb[filename] = function(dependenciesReldir, dependencies, unknownDependencies) {
					clearTimeout(timer);
					delete blade._cb[filename];
					st.parentNode.removeChild(st);
					//Load all dependencies, too
					if(dependencies.length > 0)
					{
						var done = 0;
						for(var i = 0; i < dependencies.length; i++)
							runtime.loadTemplate(baseDir, dependenciesReldir + "/" + dependencies[i], compileOptions, function(err, tmpl) {
								if(err) return callCallbacks(tmp.cb, err);
								if(++done == dependencies.length)
									callCallbacks(tmp.cb);
							});
					}
					else
						callCallbacks(tmp.cb);
				};
				tmp.cb = [cb];
				//Insert script tag into the DOM
				var s = document.getElementsByTagName('script')[0];
				s.parentNode.insertBefore(st, s);
				//Also setup onload, onreadystatechange, and onerror callbacks to detect errors earlier than the timeout
				st.onload = st.onreadystatechange = st.onerror = function() {
					var x = this.readyState;
					if((!x || x == "loaded" || x == "complete") && blade._cb[filename])
					{
						clearTimeout(timer);
						errorFunction("Request failed");
					}
				};
			}
			return false;
		}
		else
		{
			compileOptions.synchronous = true;
			require('./blade').compileFile(baseDir + "/" + filename,
				compileOptions, function(err, wrapper) {
					if(err) return cb(err);
					cb(null, wrapper.template);
				}
			);
			return true;
		}
	}
	
	/* This function is a hack to get the resolved URL, so that caching works
		okay with relative URLs.
		This function does not work properly if `filename` contains too many "../"
		For example, passing "alpha/beta/../../filename.blade" is acceptable; whereas, 
		"alpha/beta/../../../filename.blade" is unacceptable input.
	*/
	runtime.resolve = function(filename) {
		if(runtime.client) {
			//Use the browser's ability to resolve relative URLs
			var x = document.createElement('div');
			x.innerHTML = '<a href="' + runtime.escape("./" + filename) + '"></a>';
			x = x.firstChild.href;
			/* suppose `window.location.href` is "http://www.example.com/foo/bar/document.html"
				and `filename` is "alpha/./beta/../charlie.blade", then
				`x` will be something like "http://www.example.com/foo/bar//alpha/charlie.blade" */
			var prefix = window.location.href.split("#")[0];
			x = x.substr(prefix.substr(0, prefix.lastIndexOf("/") ).length).replace(/\/[\/]+/g, '/');
			if(x.charAt(0) == '/') x = x.substr(1);
			return x;
		}
	};
	
	runtime.include = function(relFilename, info) {
		//Save template-specific information
		var pInc = info.inc,
			pBase = info.base,
			pRel = info.rel,
			pFilename = info.filename,
			pLine = info.line,
			pCol = info.col,
			pSource = info.source,
			pLocals = info.locals;
		info.inc = true;
		//If exposing locals, the included view gets its own set of locals
		if(arguments.length > 2)
		{
			info.locals = {};
			for(var i = 2; i < arguments.length; i += 2)
				info.locals[arguments[i]] = arguments[i+1];
		}
		//Now load the template and render it
		var sync = runtime.loadTemplate(info.base, info.rel + "/" + relFilename,
			runtime.compileOptions, function(err, tmpl) {
				if(err) throw err;
				var len = info.length;
				tmpl(info.locals, function(err, html) {
					//This is run after the template has been rendered
					if(err) throw err;
					//Now, restore template-specific information
					info.inc = pInc;
					info.base = pBase;
					info.rel = pRel;
					info.filename = pFilename;
					info.line = pLine;
					info.col = pCol;
					info.source = pSource;
					info.locals = pLocals;
					//If the file did not declare any blocks, capture output as HTML and add a branch label
					if(!info.bd)
					{
						html = runtime.capture(info, len);
						info.push(liveUpdate.labelBranch(info.filename + ":" + info.line + ":inc:" + relFilename,
							function() {return html;}) );
					}
				}, info);
		});
		if(!sync) throw new Error("Included file [" + info.rel + "/" + relFilename +
			"] could not be loaded synchronously!");
	};
	
	/* Defines a function, storing it in __.func */
	runtime.func = function(funcName, func, info) {
		var x = info.func[funcName] = func;
		x.filename = info.filename;
		x.source = info.source;
	};
	
	/* Calls a function, setting the buffer's filename property, as appropriate
		for proper error reporting */
	runtime.call = function(funcName, idClass, info) {
		//Get remaining arguments to be passed to the function
		var func = info.func[funcName],
			args = [info];
		if(func == null)
			throw new Error("Function '" + funcName + "' is undefined.");
		for(var i = 3; i < arguments.length; i++)
			args[i-2] = arguments[i];
		var oldFilename = info.filename,
			oldSource = info.source;
		info.filename = func.filename;
		info.source = func.source;
		func.apply(idClass, args); //Call the function
		info.filename = oldFilename;
		info.source = oldSource;
	};
	
	/* Capture the output of a function
		and delete all blocks defined within the function.
		The third (undocumented) parameter to runtime.capture is the return
		value from the function or chunk.
	*/
	runtime.capture = function(buf, start) {
		//Delete all blocks defined within the function
		for(var i in buf.blocks)
		{
			var x = buf.blocks[i];
			if(x.pos >= start && (!buf.block || x.parent == buf.block) )
			{
				//Insert the buffer contents where it belongs
				if(x.parent == null)
					buf[x.pos] = x.buf.join("");
				else
				{
					x.parent.buf[x.pos] = x.buf.join("");
					x.parent.numChildren--;
				}
				//Delete the block
				delete buf.blocks[i];
			}
		}
		/* Now remove the content generated by the function from the buffer
			and return it as a string */
		return buf.splice(start, buf.length - start).join("");
	};
	
	/* Define a chunk, a function that returns HTML. */
	runtime.chunk = function(name, func, info) {
		info.chunk[name] = function() {
			//This function needs to accept params and return HTML
			/* Note: This following line is the same as:
				var len = info.length;
				func.apply(this, arguments);
				return runtime.capture(info, len);
			*/
			return runtime.capture(info, info.length, func.apply(this, arguments) );
		};
	};
	
	/* isolateWrapper is a helper function
		- func - a function to be called anytime its data dependencies change
		- buf - the template buffer
		Returns HTML generated by liveUpdate.isolate(...)
	*/
	function isolateWrapper(func, buf, disableReactivity) {
		function wrapper() {
			//Temporarily make blocks inaccessible to func()
			var blocks = buf.blocks;
			buf.blocks = {};
			/* Note: This following line is the same as:
				var len = buf.length;
				func();
				return runtime.capture(buf, len);
			*/
			var html = runtime.capture(buf, buf.length, func() );
			//Restore blocks
			buf.blocks = blocks;
			return html;
		}
		return disableReactivity ? wrapper() : liveUpdate.isolate(wrapper);
	}
	/* Define an isolate block */
	runtime.isolate = function(func, buf) {
		buf.push(isolateWrapper(func, buf) );
	};
	
	/* Define a constant block */
	runtime.constant = function(label, func, buf) {
		buf.push(liveUpdate.labelBranch(buf.filename + ":" + label, function () {
			return liveUpdate.createLandmark({"constant": true}, function(landmark) {
				/* Note: This following line is the same as:
					var len = buf.length;
					func();
					return runtime.capture(buf, len);
				*/
				return runtime.capture(buf, buf.length, func() );
			});
		}) );
	};
	
	/* Define a preserve block */
	runtime.preserve = function(label, preserved, func, buf) {
		buf.push(liveUpdate.labelBranch(buf.filename + ":" + label, function () {
			return liveUpdate.createLandmark({"preserve": preserved}, function(landmark) {
				/* Note: This following line is the same as:
					var len = buf.length;
					func();
					return runtime.capture(buf, len);
				*/
				return runtime.capture(buf, buf.length, func() );
			});
		}) );
	};
	
	/* Foreach/else block */
	runtime.foreach = function(buf, cursor, itemFunc, elseFunc) {
		var disableReactivity = false;
		//Define wrapper functions for itemFunc and elseFunc
		function itemFuncWrapper(item) {
			var label = item._id || (typeof item === "string" ? item : null) ||
				liveUpdate.UNIQUE_LABEL;
			return liveUpdate.labelBranch(label, function() {
				return isolateWrapper(function() {
					return itemFunc.call(item, item);
				}, buf, disableReactivity);
			});
		}
		function elseFuncWrapper() {
			return liveUpdate.labelBranch("else", function() {
				return elseFunc ? isolateWrapper(elseFunc, buf, disableReactivity) : "";
			});
		}
		//Call liveUpdate.list for Cursor Objects
		if(cursor && "observe" in cursor)
			buf.push(liveUpdate.list(cursor, itemFuncWrapper, elseFuncWrapper) );
		else
		{
			disableReactivity = true;
			//Allow non-Cursor Objects or Arrays to work, as well
			var html = "", empty = 1;
			for(var i in cursor)
			{
				empty = 0;
				html += itemFuncWrapper(cursor[i]);
			}
			buf.push(empty ? elseFuncWrapper() : html);
		}
	};
	
	/* Copies error reporting information from a block's buffer to the main
		buffer */
	function blockError(buf, blockBuf, copyFilename) {
		if(copyFilename)
		{
			buf.filename = blockBuf.filename;
			buf.source = blockBuf.source;
		}
		buf.line = blockBuf.line;
		buf.col = blockBuf.col;
	}
	
	/* Defines a block */
	runtime.blockDef = function(blockName, buf, childFunc) {
		var block = buf.blocks[blockName] = {
			'parent': buf.block || null, //set parent block
			'buf': [], //block get its own buffer
			'pos': buf.length, //block knows where it goes in the main buffer
			'numChildren': 0 //number of child blocks
		};
		//Copy some properties from buf into block.buf
		var copy = ['r', 'blocks', 'func', 'locals', 'cb', 'base', 'rel', 'filename', 'source'];
		for(var i in copy)
			block.buf[copy[i]] = buf[copy[i]];
		/* Set the block property of the buffer so that child blocks know
		this is their parent */
		block.buf.block = block;
		//Update numChildren in parent block
		if(block.parent)
			block.parent.numChildren++;
		//Leave a spot in the buffer for this block
		buf.push('');
		//If parameterized block
		if(childFunc.length > 1)
			block.paramBlock = childFunc;
		else
		{
			try {childFunc(block.buf); }
			catch(e) {blockError(buf, block.buf); throw e;}
		}
	};
	
	/* Render a parameterized block
		type can be one of:
			"a" ==> append (the default)
			"p" ==> prepend
			"r" ==> replace
	*/
	runtime.blockRender = function(type, blockName, buf) {
		var block = buf.blocks[blockName];
		if(block == null)
			throw new Error("Block '" + blockName + "' is undefined.");
		if(block.paramBlock == null)
			throw new Error("Block '" + blockName +
				"' is a regular, non-parameterized block, which cannot be rendered.");
		//Extract arguments
		var args = [block.buf];
		for(var i = 3; i < arguments.length; i++)
			args[i-2] = arguments[i];
		if(type == "r") //replace
			block.buf.length = 0; //an acceptable way to empty the array
		var start = block.buf.length;
		//Render the block
		try{block.paramBlock.apply(this, args);}
		catch(e) {blockError(buf, block.buf, 1); throw e;}
		if(type == "p")
			prepend(block, buf, start);
	}
	
	/* Take recently appended content and prepend it to the block, fixing any
		defined block positions, as well. */
	function prepend(block, buf, start) {
		var prepended = block.buf.splice(start, block.buf.length - start);
		Array.prototype.unshift.apply(block.buf, prepended);
		//Fix all the defined blocks, too
		for(var i in buf.blocks)
			if(buf.blocks[i].parent == block && buf.blocks[i].pos >= start)
				buf.blocks[i].pos -= start;
	}
	
	/* Append to, prepend to, or replace a defined block.
		type can be one of:
			"a" ==> append
			"p" ==> prepend
			"r" ==> replace
	*/
	runtime.blockMod = function(type, blockName, buf, childFunc) {
		var block = buf.blocks[blockName];
		if(block == null)
			throw new Error("Block '" + blockName + "' is undefined.");
		if(type == "r") //replace
		{
			//Empty buffer and delete parameterized block function
			delete block.paramBlock;
			block.buf.length = 0; //empty the array (this is an accepted approach, btw)
		}
		var start = block.buf.length;
		//If parameterized block (only works for type == "r")
		if(childFunc.length > 1)
			block.paramBlock = childFunc;
		else
		{
			try {
				//Copy buf.rel and buf.base to block.buf
				block.buf.rel = buf.rel;
				block.buf.base = buf.base;
				childFunc(block.buf);
			}
			catch(e) {blockError(buf, block.buf); throw e;}
		}
		if(type == "p") //prepend
			prepend(block, buf, start);
	};
	
	/* Inject all blocks into the appropriate spots in the main buffer.
		This function is to be run when the template is done rendering.
		Although runtime.done looks like a O(n^2) operation, I think it is
		O(n * max_block_depth) where n is the number of blocks. */
	runtime.done = function(buf) {
		//Iterate through each block until done
		var done = false;
		while(!done)
		{
			done = true; //We are done unless we find work to do
			for(var i in buf.blocks)
			{
				var x = buf.blocks[i];
				if(!x.done && x.numChildren == 0)
				{
					//We found work to do
					done = false;
					//Insert the buffer contents where it belongs
					if(x.parent == null)
						buf[x.pos] = x.buf.join("");
					else
					{
						x.parent.buf[x.pos] = x.buf.join("");
						x.parent.numChildren--;
					}
					x.done = true;
				}
			}
		}
		//Move event handlers to the buffer Object
		buf.eventHandlers = eventHandlers;
		eventHandlers = {};
		if(!runtime.client) runtime.ueid = 0;
	};
	
	/* Adds error information to the error Object and returns it */
	runtime.rethrow = function(err, info) {
		if(info == null)
			info = err;
		//prevent the same error from appearing twice
		if(err.lastFilename == info.filename && err.lastFilename != null)
			return err;
		info.column = info.column || info.col;
		//Generate error message
		var msg = err.message + "\n    at " +
			(info.filename == null ? "<anonymous>" : info.filename) + 
			(info.line == null ? "" : ":" + info.line +
				(info.column == null ? "" : ":" + info.column) );
		if(info.source != null)
		{
			var LINES_ABOVE_AND_BELOW = 3;
			var lines = info.source.split("\n"),
				start = Math.max(info.line - LINES_ABOVE_AND_BELOW, 0),
				end = Math.min(info.line + LINES_ABOVE_AND_BELOW, lines.length),
				digits = new String(end).length;
			lines = lines.slice(start, end);
			msg += "\n\n";
			for(var i = 0; i < lines.length; i++)
				msg += pad(i + start + 1, digits) +
					(i + start + 1 == info.line ? ">\t" : "|\t") +
					lines[i] + "\n";
		}
		err.message = msg;
		err.lastFilename = info.filename;
		//Only set these properties once
		if(err.filename == null && err.line == null)
		{
			err.filename = info.filename;
			err.line = info.line;
			err.column = info.column;
		}
		return err;
	};
	
	//A rather lame implementation, but it works
	function pad(number, count) {
		var str = number + " ";
		for(var i = 0; i < count - str.length + 1; i++)
			str = " " + str;
		return str;
	}
})(
/* runtime.trigger function - I pass it into the function here because
	eval() screws up Uglify JS's name mangling, making the runtime much
	larger. By doing it this way, none of the other variables are in scope.

	Retrieves the proper event handler, which is encoded in a comment right
	before the element, runs it through eval(), and installs it as the event
	handler. Finally, the event is handled.
	This function is more minified because UglifyJS won't completely minify
	a function that contains an eval().
	-e refers to the DOM element that triggered the event
	-t refers to the arguments passed to the event handler
	-t[0] refers to the first argument (the browser's event Object)
*/
function(e, t) {
	//I apologize in advance for the lack of readability here... :/
	var r = e.previousSibling, //refers to the comment element
		i = {}, //refers to the event Object map
		h, //array holding each event type in the Object map
		n; //index into h.  h[n] refers to a event type
	eval(r.textContent); //populates i with event Object map
	e.parentNode.removeChild(r);
	/* now i is an Object like: {
			"click": function() {...},
			"change keyup": function() {...},
			...
		}
		where keys are space-delimited event types and values are event handler functions
	*/
	//now r refers to the properties populated in the event Object map
	for(r in i)
	{
		//i[r] refers to the event handler
		h = r.split(" "); //h is now ["change", "keyup", ...]
		//h[n] now refers to the event type
		for(n = 0; n < h.length; n++)
			e["on" + h[n]] = i[r];
	}
	return e["on" + t[0].type].apply(e, t);
});
;//     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var touch = {},
    touchTimeout, tapTimeout, swipeTimeout,
    longTapDelay = 750, longTapTimeout

  function parentIfText(node) {
    return 'tagName' in node ? node : node.parentNode
  }

  function swipeDirection(x1, x2, y1, y2) {
    var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2)
    return xDelta >= yDelta ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
  }

  function longTap() {
    longTapTimeout = null
    if (touch.last) {
      touch.el.trigger('longTap')
      touch = {}
    }
  }

  function cancelLongTap() {
    if (longTapTimeout) clearTimeout(longTapTimeout)
    longTapTimeout = null
  }

  function cancelAll() {
    if (touchTimeout) clearTimeout(touchTimeout)
    if (tapTimeout) clearTimeout(tapTimeout)
    if (swipeTimeout) clearTimeout(swipeTimeout)
    if (longTapTimeout) clearTimeout(longTapTimeout)
    touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
    touch = {}
  }

  $(document).ready(function(){
    var now, delta

    $(document.body)
      .bind('touchstart', function(e){
        now = Date.now()
        delta = now - (touch.last || now)
        touch.el = $(parentIfText(e.touches[0].target))
        touchTimeout && clearTimeout(touchTimeout)
        touch.x1 = e.touches[0].pageX
        touch.y1 = e.touches[0].pageY
        if (delta > 0 && delta <= 250) touch.isDoubleTap = true
        touch.last = now
        longTapTimeout = setTimeout(longTap, longTapDelay)
      })
      .bind('touchmove', function(e){
        cancelLongTap()
        touch.x2 = e.touches[0].pageX
        touch.y2 = e.touches[0].pageY
        if (Math.abs(touch.x1 - touch.x2) > 10)
          e.preventDefault()
      })
      .bind('touchend', function(e){
         cancelLongTap()

        // swipe
        if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
            (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))

          swipeTimeout = setTimeout(function() {
            touch.el.trigger('swipe')
            touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
            touch = {}
          }, 0)

        // normal tap
        else if ('last' in touch)

          // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
          // ('tap' fires before 'scroll')
          tapTimeout = setTimeout(function() {

            // trigger universal 'tap' with the option to cancelTouch()
            // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
            var event = $.Event('tap')
            event.cancelTouch = cancelAll
            touch.el.trigger(event)

            // trigger double tap immediately
            if (touch.isDoubleTap) {
              touch.el.trigger('doubleTap')
              touch = {}
            }

            // trigger single tap after 250ms of inactivity
            else {
              touchTimeout = setTimeout(function(){
                touchTimeout = null
                touch.el.trigger('singleTap')
                touch = {}
              }, 250)
            }

          }, 0)

      })
      .bind('touchcancel', cancelAll)

    $(window).bind('scroll', cancelAll)
  })

  ;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(m){
    $.fn[m] = function(callback){ return this.bind(m, callback) }
  })
})(Zepto)
;Wu.Views.list = Backbone.View.extend({

  template: JST['category.show'],

  initialize: function(params){
    if(!params || !params.noJumper){
      this.jumper = new Wu.Views.listJumper({
        list: this.$el,
        el: $("#alphabet")
      });
      this.$el.on("click",".jumper",$.proxy(this.jumper.show,this.jumper));
    }
  },

  render: function(){
    var self = this;
    this.template({model: this.model,jumper:this.jumper},function(err,html){
      self.$el.html(html);
      self.jumper && self.jumper.render();

      var topEl = self.$(".title")[0] || self.$("li")[0];
      topEl && topEl.scrollIntoView();
    });
    return this;
  },
  unrender:function(){
    this.jumper && this.jumper.unrender();
  }

});;Wu.Views.categories = Backbone.View.extend({
  template: JST['category.container'],

  initialize: function(){
    this.list =  new Wu.Views.categoryList({
      model: this.model,
      className: 'category',
      parent: this
    })

    this.popup = new Wu.Views.categoryPopup({
      collection: Wu.Cache.Collections.playlists,
      model: this.model,
      className:'popup'
    })
    this.listenTo(this.model,"change:id",function(){
      this.model.fetch();
    });

    this.listenTo(this.list,"showPopup",function(){
      this.popup.show();
    })
    this.listenTo(this.list,"rendered",function(){
      this.popup.hide();
    })

    this.listenTo(this,"tracksInserted", this.tracksInserted);
  },
  render: function(){
    var self = this;

    this.template({},function(err,html){
      self.$el.html(html)
      .append(self.popup.render().$el);

      self.$("#category-container").html(self.list.render().$el);
    }); 

    return this;
  },
  unrender: function(){
    this.stopListening();
    this.list.unrender();
  },
  tracksInserted: function(){
    this.model.fetch();
  },

});;Wu.Views.categoryList = Wu.Views.list.extend({

  ORDER: ["Artist","Album","Title"],
  infoTemplate: JST['category.info'],

  events: {
    "click .category-list li:not(.jumper)" : "select",
    "click .title"          : "showPopup"
  },

  initialize:function(params){
    Wu.Views.list.prototype.initialize.call(this,params);
    if(params.url){
      this.url = params.url
    }else{
      this.url = "category/";
      this.isCategory = true;
    }

    this.listenTo(this.model,"change:docs",this.render);
    this.listenTo(Wu.Cache.Collections.servers, "add remove", function(){
      if(this.isCategory && !Wu.Cache.Collections.servers.pathSet){
        this.render();
      }
    })
  },

  render:function(){
    var self = this,
        docs = this.model.get("docs");

    if(!this.isCategory || Wu.Cache.Collections.servers.pathSet){
      Wu.Views.list.prototype.render.call(this);
      $("#mask").hide();
      this.trigger("rendered");
    }else{
      this.infoTemplate({servers: Wu.Cache.Collections.servers},function(err,html){
        self.$el.html(html);
        $("#mask").show();
      })
    }
    return this;
  },

  unrender:function(){
    Wu.Views.list.prototype.unrender.call(this);
    this.$el.off();
    this.stopListening();
  },
  select: function(e){
    var category = this.model.filter($(e.target).text(),e.target.id);
    if(category)
      Backbone.history.navigate(this.url+category,{trigger:true});
    else
      this.trigger("showPopup")
  },
  showPopup:function(e){
    e.preventDefault();
    this.trigger("showPopup")
  }

});;Wu.Views.categoriesNav = Backbone.View.extend({

  template: JST['category.nav'],

  initialize: function(){
    this.listenTo(this.model,"change:id",this.updateActive);
  },
  render: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html);
      self.updateActive({},self.model.get('id'));
    });
    return this;
  },
  unrender:function(){
    this.stopListening();
  },
  updateActive: function(model,category){
    this.$(".active").removeClass('active');
    this.$("."+category).addClass("active");
  }

});;Wu.Views.categoryPopup = Backbone.View.extend({

  template: JST['category.popup'],

  events: {
    "click h1.play i"             : "playNow",
    "click h1.play .next"         : "playNext",
    "click h1.add"                : "showAddTo",
    "click h1.new"                : "showCreate",
    "click span.new"              : "showCreate",
    "click .cancel"               : "back",
    "submit .bottom-box.new form" : "createList",
    "click .bottom-box.add li"    : "addToList"
  },
  
  render: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html);
      self.setHeight();
    });
    return this;
  },

  unrender: function(){
    var filter = this.model.get("filter");
    filter && delete filter._id;
    $("#mask").off("click",$.proxy(this.hide,this));
  },

  setHeight: function(){
    var height = $(window).height() - (Math.round($(window).height() * .11)) - 100;

    height = Math.min(500,height);
    this.$(".bottom-box").css("max-height",height);
  },

  generateList: function(){
    if(this.collection.length){
      var result = "<ul>";
      this.collection.each(function(el){

        result += "<li listId='"+el.get('_id')+"'>"+el.get('name')+"</li>";
      });
      result += "</ul>"
    }else{
      var result = "No exisiting playlists, <span class='new'>create one</span> to continue"
    }
    return result;
  },

  showAddTo:function(){
    this.$el.addClass("add expand");
    this.collection.fetch({
      success: $.proxy(function(){
        this.$(".bottom-box.add").html(this.generateList());
      },this)
    }) 
  },

  showCreate:function(){
    this.$el.removeClass("add")
    .addClass("new expand");

    this.$("input.name").val("");
  },

  back:function(){
    if(this.$el.hasClass('expand')){
      this.$el.removeClass("new add expand");
    }else{
      this.hide();
    }
  },

  show:function(){
    $("#mask").show();
    $("#mask").on("click",$.proxy(this.hide,this));
    this.$el.show();
  },

  hide:function(){
    $("#mask").hide();
    $("#mask").off("click",$.proxy(this.hide,this));
    this.$el.hide();
    this.$el.removeClass("new add expand");
    var filter = this.model.get("filter");
    filter && delete filter._id;
  },

  createList:function(e){
    e.preventDefault();
    var name = this.$(".bottom-box.new .name")[0].value;
    if(name == ""){
      alert("please enter a name")
    }else{
      var list = new Wu.Models.playlist({name:name}),
          filter = this.model.get("filter");

      list.set("filter",filter);
      list.save(null,{
        success:$.proxy(function(model){
          var message = 'Playlist "'+name+'" created with '+model.get("added")+' tracks';
          this.collection.add(model);
          Wu.Cache.Views.toastMaster.message(message);
        },this),
        error:function(model,xhr){
          var message = xhr.responseText;
          Wu.Cache.Views.toastMaster.error(message);
        }
      });
      list.set('filter',false);
      this.hide();
    }
  },
  playNow:function(){
    var id = Wu.Cache.Models.player.get("quickList"),
        list = this.collection.get(id);

    if(!list){
      Wu.Cache.Views.toastMaster.error("Must select a media renderer first");
      return;
    }

    list.set("clearAfter",0);
    this._add(list,function(){
      Socket.emit("playPlaylist",id);
    });
  },
  playNext:function(){
    var player = Wu.Cache.Models.player,
        id = player.get("quickList"),
        list = this.collection.get(id),
        currentTrack = player.get('currentPlayingTrack'),
        currentListId = player.get('playlist'),
        position = (currentTrack) ? currentTrack.playlist[currentListId] || 0 : 0;

    if(!list){
      Wu.Cache.Views.toastMaster.error("Must select a media renderer first");
      return;
    }

    list.set("clearAfter",position);
    this._add(list);
  },
  addToList:function(e){
    var id = $(e.target).attr('listId'),
        list = this.collection.get(id);
    this._add(list);
  },

  _add: function(list,cb){
    var filter = this.model.get("filter");

    list.set("filter",filter);
    list.save(null,{
      success:function(model){
        var message = model.get("added")+' tracks added to "'+list.get('name')+'" playlist';
        Wu.Cache.Views.toastMaster.message(message);
        typeof(cb) === 'function' && cb();
       },
      error:function(model,xhr){
        var message = xhr.responseText;
        Wu.Cache.Views.toastMaster.error(message);
      }
    });
    list.unset('filter');
    list.unset('clearAfter');
    this.hide();
  }

});;Wu.Views.directories = Backbone.View.extend({
  template: JST['directory.container'],

  events: {
    "click .popup .ok"     : "chooseDirectory",
    "click .popup .cancel" : "hidePrompt"
  },

  initialize: function(){
    this.list =  new Wu.Views.categoryList({
      model: this.model,
      className: 'category',
      url:"directory/",
      noJumper:true,
      parent: this
    })

    this.listenTo(this.model,"change:id",function(){
      this.model.fetch({
        error:function(model,xhr){
          Wu.Cache.Views.toastMaster.error(xhr.responseText);
          window.history.back();
        }
      });
    });

    this.listenTo(this.list,"showPopup",this.showPrompt);
  },
  render: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html)
      self.$("#category-container").html(self.list.render().$el);
    });
    return this;
  },
  unrender: function(){
    this.stopListening();
    this.list.unrender();
  },
  showPrompt: function(){
    $("#mask").show();
    this.$(".popup").show();
  },
  hidePrompt: function(){
    $("#mask").hide();
    this.$(".popup").hide();
  },
  chooseDirectory: function(){
    var uuid = this.model.get("uuid"),
        dirId = this.model.get("id"),
        server = Wu.Cache.Collections.servers.get(uuid),
        title = this.model.getTitle(),
        name;

    if(server){
      name = server.get("name");
      server.save({path: dirId},{
        success: function(){
          Wu.Cache.Views.toastMaster.message('Adding tracks in "'+title+'" from "'+name+'"');
        },
        error: function(xhr){
          Wu.Cache.Views.toastMaster.error(xhr.responseText);
        }
      });
      Backbone.history.navigate("/",{trigger:true});
    }
  }

});;Wu.Views.header = Backbone.View.extend({

  template: JST['header'],

  events: {
    "click .menuLink" : "toggleMenu"
  },

  initialize: function(){
    var self = this;
    this.template({},function(err,html){
      self.$el.html(html);
    });
  },
  render: function(){
    this.subHeader && this.subHeader.render();
    return this;
  },
  unrender:function(){
    this.subHeader && this.subHeader.unrender();
  },
  setSubHeader: function(view){
    this.subHeader && this.subHeader.unrender();
    this.subHeader = view;
    this.$("#subnav").html(this.subHeader.render().$el);
  },
  removeSubHeader: function(){
    if(this.subHeader){
      this.subHeader.unrender();
      this.subHeader.remove();
    }
  },
  toggleMenu: function(){
    this.trigger("menuClick");
  } 

});;Wu.Views.listJumper = Backbone.View.extend({

  events: {
    "click .back"       : "hide",
    "click span.active" : "jump"
  },

  initialize: function(params){
    this.$listEl = $(params.list);
    this.secret = Math.random();
  },

  render: function(){
    this.$el.html(this.setupJumper());
    return this;
  },
  unrender:function(){
    this.$el.off();
    $("#mask").off("click",$.proxy(this.hide,this));
  },
  setupJumper:function(){
    var current,
        html = "<div class='back icon-chevron-left'></div>";
    for(var i=65; i<91; i++){
      current = String.fromCharCode(i)
      if(this.$listEl.find('#jumper'+current).length > 0){
        html += '<span class="active">'+ current +'</span>';
      }else{
        html += '<span class="greyed">'+ current +'</span>';
      }
    }
    return html;
  },
  jump:function(e){
    console.log(this.secret);
    var letter = $(e.target).html();
    this.$listEl.find("#jumper"+letter)[0].scrollIntoView();
    this.hide();
  },
  show: function(){
    this.$el.addClass('flipOut');
    $("#mask").on("click",$.proxy(this.hide,this));
    $("#mask").show();
  },
  hide: function(){
    this.$el.removeClass('flipOut');
    $("#mask").off("click",$.proxy(this.hide,this));
    $("#mask").hide();
  }

});;Wu.Views.menu = Backbone.View.extend({

  template: JST['menu'],

  events:{
    "click .renderers li"  : "setRenderer",
    "click .musicLink"     : "gotoMusic", 
  },

  initialize: function(){
    this.listenTo(Wu.Layout.header,"menuClick",this.show);
    this.listenTo(this.collection,"add remove reset",this.render);
    this.listenTo(Wu.Cache.Collections.servers,"add remove reset",this.render);
    this.listenTo(Wu.Cache.Collections.playlists,"add remove reset",this.render);
    this.listenTo(this,"hideMusic",this.hideMusic);
    this.listenTo(this,"showMusic",this.showMusic);
    this.listenTo(this,"inserted",this.setupDrag);
    this.listenTo(Wu.Cache.Models.player,"change:id",this.setActive);
    this.listenTo(Wu.Cache.Models.player,"change:playlist",this.setActive);
    this.listenTo(Wu.Cache.Models.player,"change:TransportState",this.setActive);
    this.$el.on("click","a",$.proxy(this.hide,this));
  },
  render: function(){
    var self = this;
    this.template({
      playlists: Wu.Cache.Collections.playlists, 
      renderers: this.collection,
      servers: Wu.Cache.Collections.servers
    },function(err,html){
      self.$el.html(html);
      if(self.showMusicLink)
        self.showMusic();
      self.setActive();
    });
    return this;
  },
  unrender: function(){
    $("#mask").off("click",$.proxy(this.hide,this));
    this.stopListening();
  },
  setupDrag: function(){
    var self = this;
    Drawer.init({el:this.$el});
    this.$el.on("left",function(){
      self.$el.css("left","-100%");
    });
    this.$el.on("right",function(){
      self.$el.css("left","0%");
    });
  },
  show: function(){
    this.$el.removeClass("hide");
    $("#mask").show()
    .on("click",$.proxy(this.hide,this));
  },
  hide: function(){
    this.$el.addClass('hide');
    $("#mask").hide()
    .off("click",$.proxy(this.hide,this));
  },
  setRenderer: function(e){
    var uuid = $(e.currentTarget).attr("id");
    Wu.Cache.Models.player.setRenderer(uuid);
    this.hide();
  },
  hideMusic: function(){
    this.$(".musicLink").hide();
    this.showMusicLink = false;
  },
  showMusic:function(){
    this.$(".musicLink").show();
    this.showMusicLink = true;
  },
  gotoMusic:function(){
    var category = Wu.Cache.Models.category.get("id") || "Artist";
    this.hide();
    Backbone.history.navigate("/category/"+category,{trigger:true});
  },
  setActive:function(){
    var renderer = Wu.Cache.Models.player.id,
        playlist = Wu.Cache.Models.player.get('playlist'),
        isPlaying = Wu.Cache.Models.player.get("TransportState") === "PLAYING";

    this.$("li").removeClass("active");
    playlist && $("#"+playlist)[isPlaying ? "addClass" : "removeClass"]("active");
    renderer && $("#"+renderer).addClass("active");
 }

});;Wu.Views.playerTab = Backbone.View.extend({

  template: JST['player.tab'],

  events:{
    "click .icon-play"  : "play",
    "click .icon-pause" : "pause",
    "click .next"       : "next",
    "mousedown .ball"   : "dragStart",
    "touchstart .ball"  : "dragStart"
  },
  initialize: function(){
    this.listenTo(this.model,"change:currentPlayingTrack",this.changeTrack);
    this.listenTo(this.model,"change:TransportState",this.changePlayState);
    this.listenTo(this,"inserted",this.setupDrag);
    this.lastTime = Date.now();
    this.animator = this.animateProgress.bind(this);
    
    this.animateProgress();

    this.listenTo($(document),"mousemove touchmove",$.proxy(this.drag,this));
    this.listenTo($(document),"mouseup touchend",$.proxy(this.dragEnd,this));

    //prevent highlighting on desktop
    this.listenTo(this.$el,"mousedown",function(e){
      e.preventDefault();
    });
    this.listenTo($(window),"resize",$.proxy(function(){
      this.width = this.$el.width() - 50;    
    },this));
    this.animate = true;
  },

  render: function(){
    var self = this;
    this.template({model: this.model},function(err,html){
      self.$el.html(html);
      self.changeTrack(self.model,self.model.get("currentPlayingTrack"));
      self.changePlayState(self.model,self.model.get("TransportState"));
      self.setPosition(self.model.get('trackPosition'));
    });
    return this;
  },
  unrender:function(){
    this.stopListening();
  },
  animateProgress: function(){
    if(this.animate && !this.dragging && this.model.get("TransportState") === "PLAYING"){
      var position = this.model.get('trackPosition')
      this.setPosition(position);
      this.model.set("trackPosition",position + Date.now() - this.lastTime ); 
    }
    this.lastTime = Date.now();
    window.requestAnimationFrame(this.animator);
  },
  setPosition: function(position){
    var left = this.width * (position/ this.model.get("duration"));
    this.$(".ball").css("-webkit-transform","translate3d("+left+"px,0,0)");
  },
  dragStart: function(e){
    this.dragging = true;
    e.preventDefault();
  },
  drag:function(e){
    if(this.dragging){
      var x = e.pageX || e.touches[0].pageX;
      this.lastX = x;
      this.$(".ball").css("-webkit-transform","translateZ(0) translateX("+x+"px)");
    }
  },  
  dragEnd: function(){
    if(this.dragging){
      var position = (this.lastX / this.width) * this.model.get("duration");  
      Socket.emit("setPosition",position);
    }
    this.dragging = false;
    this.animate = false;
    var self = this;
    //Hack, wait some time so that our set position will get fed back to us
    setTimeout(function(){
      self.animate = true; 
    },1000)
    
  },
  setupDrag: function(){
    var self = this;
    this.width = this.$el.width() - 50;
    Drawer.init({el:this.$el});
    this.$el.on("left",function(){
      self.$el.css("left","0%");
    });
    this.$el.on("right",function(){
      if(!self.dragging){
        self.$el.css("left","100%");
      }
    });
  },
  play: function(){
    Socket.emit("play");
  },
  pause: function(){
    Socket.emit("pause");
  },
  next: function(){
    Socket.emit("next");
  },
  changeTrack:function(model,track){
    var title = (track && track.Title) ? track.Title : "Unknown";
    this.$(".title").html(title)
    .attr("href","/playlist/"+model.get("playlist"));

    
    if(track){
      var parser=new DOMParser();
      var xmlDoc = parser.parseFromString(track.Didl,"text/xml");
      var artNode = xmlDoc.getElementsByTagName("albumArtURI")[0]
      if(artNode){
        var artURI = artNode.childNodes[0].nodeValue;
        if(artURI != this.albumArt){
          $("body").css("background-image","url("+artURI+")");
          this.albumArt = artURI;
        }
      }
    }

  },
  changePlayState:function(model,value){
    if(value === "PLAYING"){
      this.$(".ball").show();
      this.$(".play").removeClass("icon-play").addClass("icon-pause");
    }else{
      this.$(".ball")[value === "PAUSED_PLAYBACK" ? "show" : "hide" ](); 
      this.$(".play").removeClass("icon-pause").addClass("icon-play");
    }
  }

});;Wu.Views.playlistDropdown = Backbone.View.extend({

  template: JST['playlist.dropdown'],

  events:{
    "click .opened .current"  : "hide",
    "click .current"          : "show"
    
    
  },

  render: function(){
    var self = this;
    this.template({currentList: this.model, playlists: Wu.Cache.Collections.playlists},function(err,html){
      self.$el.html(html);
    });
    return this;
  },
  unrender:function(){
    $("#mask").off("click",$.proxy(this.hide,this));
    this.stopListening();
  },
  show: function(e){
    $("#mask").show();
    $("#mask").on("click",$.proxy(this.hide,this));
    this.$(".dropDown").addClass("opened");
    this.$(".down").removeClass("icon-angle-down").addClass("icon-angle-up");
    e.stopImmediatePropagation()
  },
  hide:function(e){
    $("#mask").hide();
    $("#mask").off("click",$.proxy(this.hide,this));
    this.$(".dropDown").removeClass("opened");
    this.$(".down").removeClass("icon-angle-up").addClass("icon-angle-down");
    e.stopImmediatePropagation()
  }

});;Wu.Views.toastMaster = Backbone.View.extend({


  initialize: function(){
    this.listenTo(Wu.Cache.Collections.renderers,"add",function(model){
      this.message('New media renderer "'+model.get("name")+'" detected');
    },this);
    this.listenTo(Wu.Cache.Collections.renderers,"remove",function(model){
      this.message('Media renderer "'+model.get("name")+'" removed');
    },this);
    this.listenTo(Wu.Cache.Collections.servers,"add",function(model){
      this.message('New media server "'+model.get("name")+'" detected');
    },this);
    this.listenTo(Wu.Cache.Collections.servers,"remove",function(model){
      this.message('Media server "'+model.get("name")+'" removed');
    },this);
    this.listenTo(Wu.Cache.Models.player,"change:currentPlayingTrack",function(model,value){
      this.title(value.Title);
    },this);
    this.listenTo(Wu.Cache.Models.player,"change:uuid",function(model,value){
      var renderer = Wu.Cache.Collections.renderers.get(value);
      if(renderer)
        this.message('Now playing to "'+renderer.get('name')+'" renderer');
      else
        this.message("No media renderer selected");
    },this);

    Socket.on("error",$.proxy(function(err){
      this.error(err);
    },this));

    Socket.on("tracksInserted",$.proxy(function(){
      this.message("New tracks inserted");
    },this));

    this.messageStack = [];
  },
  title: function(text){
    window.clearTimeout(this.titleTimeout);
    $("title").html(text);
    this.titleTimeout = window.setTimeout(function(){
      $("title").html("Wu");
    },4000)
  },
  message: function(text){
    this.messageStack.push({text:text,type:'message'});
    this._show()
  },
  error: function(text){
    this.messageStack.push({text:text,type:'error'});
    this._show()
  },
  _add: function(text){
    this.messageStack.push(text);
    $(".toast").html(text)
    $(".toast-wrap").show();
    window.setTimeout(function(){
      $(".toast-wrap").hide();
    },4000);
  },
  _show: function(){
    if($(".toast-wrap").css("display") === "none" && this.messageStack.length){
      var toast = this.messageStack.shift();
      $(".toast-wrap")[toast.type === 'error' ? 'addClass' : 'removeClass']("error")
      .show();
      
      $(".toast").html(toast.text)

      window.setTimeout($.proxy(function(){
        $(".toast-wrap").hide();
        this._show();
      },this),4000);
    }
  }

});;Wu.Views.trackList = Backbone.View.extend({

  template: JST['track.list'],

  events: {
    "click .track-info"           : "play"
  },

  initialize: function(params){
    this.listenTo(Wu.Cache.Models.player,"change:currentPlayingTrack",this.highlight);
    this.listenTo(this,"inserted",this.highlight);
    this.listenTo(this,"swipeAway",this.delete);
    Wu.Mixin.mix(this,Wu.Mixin.swipeAway)
  },

  render: function(){
    var self = this;
    this.template({collection: this.collection},function(err,html){
      self.$el.html(html);
      self.$("li").length && self.$("li")[0].scrollIntoView();
    });
    return this;
  },
  unrender:function(){
    this.stopListening();
  },
  highlight:function(){
    var track = Wu.Cache.Models.player.get("currentPlayingTrack"),
        id = (track) ? track._id : false;
    this.$("li").removeClass("active");
    $("#"+id).addClass('active');
  },
  play: function(e){
    if($(e.currentTarget).parent().hasClass("transition")){
      return;
    }else{
      var id = $(e.currentTarget).parent().parent().attr('id');
      Wu.Cache.Models.player.playById(id,this.model.get("_id"));
    }
  },
  delete:function(id){
    var track = this.collection.get(id);
    if(track){
      track.destroy({
        error:function(model,xhr){
          var message = xhr.responseText;
          Wu.Cache.Views.toastMaster.error(message);
        }
      })
    }
  }

});;Wu.Models.category = Backbone.Model.extend({

  ORDER: ["Artist","Album","Title"],

  urlRoot: '/api/categories',

  initialize: function(){
    Socket.on("tracksInserted",function(){
      Wu.Layout.page.trigger("tracksInserted");
    })
  },

  fetch: function(options){
    var filter = this.get('filter');
    options = options || {};
    options.data = _.extend({},options.data,{'filter':filter})
    Backbone.Model.prototype.fetch.call(this,options);

  },

  filter: function(value,_id){
    var filter = this.get("filter") || {},
        id = this.get('id'),
        index = _.indexOf(this.ORDER,id);
        
    index++;
    if(index < this.ORDER.length){
      filter[id] = value;
      this.set("filter",filter)
    }else if(id === "Title"){
      filter._id = _id;
    }
    return this.ORDER[index];
  },
  setCategory: function(category){
    var filter = this.get("filter") || {},
        id = this.get('id'),
        currentIndex = _.indexOf(this.ORDER,id);
        newIndex = _.indexOf(this.ORDER,category);
    
    while(newIndex <= currentIndex){
      filter[this.ORDER[currentIndex]] && delete filter[this.ORDER[currentIndex]];
      currentIndex--;
    }
    filter._id &&  delete filter._id;
    this.set("filter",filter);
    this.set("id",category);
  },
  getTitle: function(){
    var filter = this.get("filter") || {},
        id = this.get('id'),
        index = _.indexOf(this.ORDER,id);

    while(--index >= 0){
      if(filter[this.ORDER[index]])
        return filter[this.ORDER[index]];
    }
    return false;
  }

});;Wu.Models.directory = Backbone.Model.extend({

  urlRoot: function(){
    return "/api/directory/"+this.get("uuid")+"/";
  },
  initialize:function(){
    this.titleMap = {};
  },
  filter:function(title,id){
    if(id){
      this.titleMap[id] = title;
      return this.get("uuid")+"/"+id;
    }else{
      return false;
    }
  },
  getTitle: function(){
    return this.titleMap[this.get("id")];
  }

});;Wu.Models.player = Backbone.Model.extend({
  urlRoot: '/api/renderers',
  idAttribute: 'uuid',

  initialize: function(){
    var self = this;
    Socket.on("stateChange",function(event){
      self.set(event.name,event.value);
    });
    Socket.on("setRendererResult",function(err,uuid){
      if(err){
        Wu.Cache.Views.toastMaster.error(err);
        self.clear();
      }else{
        self.set('uuid',uuid);
        self.fetch();
      }
    }),
    Socket.on("rendererRemoved",function(renderer){
      if(self.get('uuid') === renderer.uuid){
        self.clear();
      }
    });
  },
  playById: function(id,playlistId){
    Socket.emit("playById",id,playlistId);
  },
  setRenderer: function(uuid){
    Socket.emit("setRenderer",uuid);
  }
});;Wu.Models.playlist = Backbone.Model.extend({
  urlRoot: '/api/playlists',
  idAttribute: "_id"

});;Wu.Models.renderer = Backbone.Model.extend({

  idAttribute: "uuid",
  urlRoot: '/api/renderers'

});;Wu.Models.server = Backbone.Model.extend({

  idAttribute: "uuid",
  urlRoot: '/api/servers'

});;Wu.Models.tracks = Backbone.Model.extend({

  idAttribute: "_id",

});;Wu.Collections.playlists = Backbone.Collection.extend({

  initialize: function(){
    Socket.on("rendererAdded",$.proxy(function(){
      this.fetch();
    },this));
  },
  model: Wu.Models.playlist,
  url: '/api/playlists'

});
;Wu.Collections.renderers = Backbone.Collection.extend({

  model: Wu.Models.renderer,
  url: '/api/renderers',

  initialize:function(){
    var self = this;
    Socket.on("rendererAdded",function(renderer){
      self.add(renderer);
    })
    Socket.on("rendererRemoved",function(renderer){
      self.remove(this.get(renderer.uuid));
    })
  }
});;Wu.Collections.servers = Backbone.Collection.extend({

  model: Wu.Models.server,
  url: '/api/servers',

  initialize:function(){
    var self = this;
    Socket.on("serverAdded",function(server){
      if(server.path)
        self.pathSet = true;
      self.add(server);
    })
    Socket.on("serverRemoved",function(server){
      self.remove(this.get(server.uuid));
    })
    
    this.on("change:path",function(){
      self.pathSet = true;
    })

    this.on("reset",function(){
      self.each(function(server){
        if(server.get('path'))
          self.pathSet = true;
      })
    })

    this.pathSet = false;
  }
});;Wu.Collections.tracks = Backbone.Collection.extend({
  model: Wu.Models.tracks,
  initialize: function(params){
    this._id = params.id;
  },
  url: function(){
    return '/api/playlists/'+this._id;
  }
});
;Wu.Routers.Categories = Backbone.Router.extend({
  routes: {
    ''                    : 'index',
    'category/:id'        : 'show',
    'playlist/:id'        : 'showList',
    'directory/:uuid/:id' : 'showDir',
    'test'                : 'testDir'
  },

  index: function(){
    this.show('Artist');
  },

  show: function(id){
    var category = Wu.Cache.Models.category;
    category.setCategory(id);

    if(Wu.Layout.state != 'categories'){
      var nav = new Wu.Views.categoriesNav({
        model: category
      });
      var page = new Wu.Views.categories({
        model: category
      });
      Wu.Layout.menu.trigger("hideMusic");
      category.fetch({
        success:function(){
          Wu.Layout.setSubHeader(nav);
          Wu.Layout.setPage(page);
          Wu.Layout.state = 'categories';
        },
        error:function(){
          Wu.Cache.Views.toastMaster.error("failed to get category");
        }
      });
    }    
  },

  showList: function(id){
    var playlist = Wu.Cache.Collections.playlists.get(id),
        tracks;
    if(playlist){
      tracks = playlist.get("tracks") || playlist.set('tracks',new Wu.Collections.tracks({id:id})).get("tracks");
      Wu.Layout.state = 'playlist';
      Wu.Layout.menu.trigger("showMusic");
      tracks.fetch({
        success:function(){
          var dropDown = new Wu.Views.playlistDropdown({
            model: playlist
          });
          var view = new Wu.Views.trackList({
            model: playlist,
            collection:tracks,
            className: "category"
          });
          Wu.Layout.setSubHeader(dropDown);
          Wu.Layout.setPage(view);
        },
        error:function(model,xhr){
          Wu.Cache.Views.toastMaster.error(xhr.responseText);
        }
      })
    }else{
      Wu.Cache.Views.toastMaster.error("Playlist not found");
    }
  },
  showDir: function(uuid,dirID){
    if(Wu.Layout.state != 'directory'){
      Wu.Layout.removeSubHeader();
      var view = new Wu.Views.directories({
        model:Wu.Cache.Models.directory,
      });
      Wu.Layout.setPage(view);
      Wu.Layout.state = 'directory';
    }
    Wu.Layout.menu.trigger("showMusic");
    Wu.Cache.Models.directory.set("uuid",uuid);
    Wu.Cache.Models.directory.set({id:dirID},{silent:true});
    //trigger this ourselves, might be same id, but uuid has changed so is different directory
    Wu.Cache.Models.directory.trigger("change:id");
  }
});;(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelRequestAnimationFrame = window[vendors[x]+
          'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());Wu.Mixin = {

  mix: function(view,mixin){
    var mixID = "_mixin",
        instance = 0,
        events,
        newEvents = [];
    while(view[mixID+instance]){
      instance++;
    }
    mixin.mixID = mixID + instance;

    view[mixID] = mixin;
    mixin.view = view;

    //namespace our events to our mixin
    events = _.isFunction(mixin.events) ? mixin.events() : mixin.events || {};
    _.each(events,function(value,key){
      if(!_.isFunction(mixin[value])){
        console.log(value + " is not a function");
        return;
      }
      var target = key.split(/\b/);
      view.$el.on(target[0],target.slice(1).join(""),$.proxy(mixin[value],mixin));
    })
    _.extend(view.events,{},newEvents);
  }

};Wu.Mixin.swipeAway = {
  touchable: 'ontouchstart' in document.documentElement,
  events: function(){
    map = {};
    if(this.touchable){
      map = {
        'touchstart .swipeEl' : 'start', 
        'touchmove  .swipeEl' : 'move',
        'touchend   .swipeEl' : 'end'
      }
    }else{
      map = {
        'mousedown .swipeEl'  : 'start', 
        'mousemove .swipeEl'  : 'move',
        'mouseout  .swipeEl'  : 'end',
        'mouseup   .swipeEl'  : 'end'
      }
    }
    map['webkitTransitionEnd .swipeEl'] = 'transitionEnd';
    map['transitionend .swipeEl'] = 'transitionEnd';
    map["click .swipeEl h1"] = "undo";

    return map;
  },
  position: function(e){
    return (e.touches) ? e.touches[0].pageX : e.pageX;
  },

  start: function(e){
    this.cover = $(e.currentTarget).find(".swipeCover");
    if($(e.currentTarget).hasClass('transition'))
      return;

    this.active = true;
    this.startX = this.position(e);
    this.pos = 0;
  
    if(!this.touchable)
      e.preventDefault();
  },
  move: function(e){
    if(this.active){
      var x = this.position(e);
      
      this.pos = Math.min(0,x - this.startX);
      if(this.pos < -5 || this.started){
        this.cover.css("-webkit-transform","translate3d("+this.pos+"px,0,0)");
        this.started = true;
      }
    } 
  },
  end: function(){
    if(this.active && this.started){
      if(this.pos < -40){
        this.cover.parent().addClass("transition");
        this.cover.css("-webkit-transform","translate3d(-"+this.cover.width()+"px,0,0)");
      }else if(this.pos < 0){
        this.cover.parent().addClass("transition");
        this.cover.css("-webkit-transform","translate3d(0,0,0)");
      }    
    }
    this.active = false;
    this.started = false;
  },
  transitionEnd: function(e){
    if(e.propertyName.indexOf('transform') != -1){
      if($(e.target).css(e.propertyName) === "translate3d(0px, 0px, 0px)"){
        $(e.currentTarget).removeClass("transition");
      }else{
        $(e.currentTarget).css("opacity",0);        
      }
    }else if(e.propertyName == 'opacity'){
      $(e.currentTarget).parent().hide();
      this.view.trigger("swipeAway",$(e.currentTarget).parent().attr('id'));
    }
  },
  undo:function(e){
    e.preventDefault();
    $(e.currentTarget).parent().css("-webkit-transform","translate3d(0,0,0)")
    .parent().removeClass("transition")
    .css("opacity",1);
  }

}