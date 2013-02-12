var servers = []
    ,KNOWN_PATHS ={ 
      "e91f16b6-f441-4de4-a65d-d1ed420c10e1"   : "0$2$2",         //ps3Media Server
      //"7076436f-6e65-1063-8074-4ce6766160b7" : "1$268435466",   //Linkstation
      //"bc4fab65-9f26-3687-bbfc-1fb761347c74" : "2"              //galaxy s2
    }

module.exports = {
  add: function(event){
    var ms = {
          name: event.value
        },
        path = KNOWN_PATHS[event.uuid];

    path && ms.path = path;
    servers[event.uuid] = ms;
  },
  remove: function(event){
    servers[event.uuid] && delete servers[event.uuid];
  },
  find: function(uuid){
    return servers[uuid];
  },
  all: function(){
    return servers;
  }
}