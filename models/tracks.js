var db = require('mongojs').connect('test', ['tracks','playlist','lists']),
    assert = require('assert');

db.tracks.remove();
var Tracks = function(){

}

Tracks.prototype = db.tracks;


var tracks = new Tracks();
module.exports = tracks;