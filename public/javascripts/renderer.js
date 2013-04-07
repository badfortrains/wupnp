$(document).ready(function(){
  window.Socket = io.connect(':3000/renderer');
  var player = {
    audio: $("#player")[0],
    audioSource: $("#player source")[0],
    play: function(){
      this.audio.play();
    },
    pause: function(){
      this.audio.pause();
    },
    seek: function(milliseconds){
      this.audio.currentTime = milliseconds/1000;
    },
    stop: function(){
      this.audioSource.src = "";
      this.audio.load();
      $(this.audio).trigger("stopped");
    },
    getPosition: function(){
      Socket.emit("positionResult",{position: this.audio.currentTime*1000, duration:this.audio.duration*1000});
    },
    openAndPlay: function(url){
      this.audioSource.src = url;
      this.audio.load();
      this.play();
    },
    listen: function(){
      Socket.on("play",$.proxy(this.play,this));
      Socket.on("pause",$.proxy(this.pause,this));
      Socket.on("seek",$.proxy(this.seek,this));
      Socket.on("stop",$.proxy(this.stop,this));
      Socket.on("openAndPlay",$.proxy(this.openAndPlay,this))
      Socket.on("getPosition",$.proxy(this.getPosition,this));

      var self = this;
      $(this.audio).on("play",function(){
        Socket.emit("stateChange",{name:"TransportState",value:"PLAYING"})
        Socket.emit("stateChange",{name:"CurrentTrackURI",value:self.audioSource.src})
      });
      $(this.audio).on("pause",function(){
        if(self.audio.currentTime != self.audio.duration){
          Socket.emit("stateChange",{name:"TransportState",value:"PAUSED_PLAYBACK"})
        }
      });
      $(this.audio).on("ended stopped",function(){
        Socket.emit("stateChange",{name:"TransportState",value:"STOPPED"})
      });

    }
  }
  player.listen();

})