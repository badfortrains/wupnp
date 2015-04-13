var net = require('net');
var util = require("util");
var events = require("events");

var DenonRemote = function(port,host){
	this.state = {
		z1Power: null,
		z1Volume: null,
		z2Power: null,
		z2Volume: null,
	},

	events.EventEmitter.call(this);
	this.socket = net.Socket({allowHalfOpen: true})

	this.socket.on("error",function(err){
		console.log("SOCKET ERR",err)
	})

	this.socket.on('data',function(buffer){
		var response = buffer.toString().trim();
		this._parseResponse(response);
	}.bind(this))

	this.socket.connect(port,host,function(){
		console.log("connected to denon server")

		//get initial state
		var stateRequests = ["ZM?","MV?","Z2?"]
		stateRequests.forEach(function(cmd,i){
			setTimeout(function(){
				this.socket.write(cmd+"\r")
			}.bind(this),i*1000)
		},this);
	}.bind(this));
}

util.inherits(DenonRemote, events.EventEmitter);

DenonRemote.prototype.getState = function(){
	return this.state;
};

DenonRemote.prototype.sendCommand = function(stateCommand,arg){
	var commands = {
		z1Power: this.state.z1Power ? "ZMOFF" : "ZMON",
		z2Power: this.state.z2Power ? "Z2OFF" : "Z2ON",
		z1Volume: "MV"+arg,
		z2Volume: "Z2"+arg,
		z1VolumeUp: "MVUP",
		z1VolumeDown: "MVDOWN",
		z2VolumeUp: "Z2UP",
		z2VolumeDown: "Z2DOWN",
	}

	var message =  commands[stateCommand] + "\r"
	this.socket.write(message);
};
	
DenonRemote.prototype._parseResponse = function(response){
	console.log("_parseResponse",response)
	var matchedEvent = false;

	function toVolume(v){
		v = v || "0"
		v = v.substr(0,2) + "." + (v.substr(2,2) || 0)
		return parseFloat(v);
	}

	function toPower(v){
		return v == "ON" ? true : false
	}

	events = [
		{name:"z1Power", 	reg: /^ZM(ON|OFF)/, convert: toPower},
		{name:"z1Volume", reg: /^MV([0-9]+)/, convert: toVolume},
		{name:"z2Power", 	reg: /^Z2(ON|OFF)/, convert: toPower},
		{name:"z2Volume",	reg: /^Z2([0-9]+)/, convert: toVolume},
	]

	events.forEach(function(e){
		var match = response.match(e.reg);
		if(match){
			matchedEvent = true;
			this.state[e.name] = e.convert(match[1]);
		}
	},this)

	if(matchedEvent){
		this.emit("stateChange",this.getState());
	}
};

var remote = new DenonRemote(23,"192.168.1.128");
module.exports = remote;

