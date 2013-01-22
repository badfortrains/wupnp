var db = require('mongojs').connect('test', ['tracks','playlist','lists']),
    assert = require('assert');

var Tracks = function(){

}

Tracks.prototype = db.tracks;


var tracks = new Tracks();
module.exports = tracks;