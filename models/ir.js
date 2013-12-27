var exec = require('child_process').exec,
    child,
    COMMANDS = {
      'off'       : "KEY_POWER",
      'volume-up'   : "KEY_VOLUMEUP",
      'volume-down' : "KEY_VOLUMEDOWN",
      'set-source'  : "KEY_0"
    },
    REMOTE = "aux";

module.exports = {
  sendCommand: function(command,cb){
    key = COMMANDS[command];
    if(!key){
      cb(new Error("Command not found"));
    }
    exec("irsend SEND_ONCE "+REMOTE +" "+key,cb);
  }
}