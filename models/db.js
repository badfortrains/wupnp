var sqlite3 = require('sqlite3').verbose(),
    db = new sqlite3.Database('/tmp/db');

db.serialize(function() {
  var TABLE = "CREATE TABLE IF NOT EXISTS tracks (_id INTEGER PRIMARY KEY,TrackNumber INTEGER, Title TEXT, Artist TEXT, Album TEXT, Didl TEXT, oID TEXT)";
  db.run("DROP TABLE IF EXISTS tracks ");
  db.run("DROP TABLE IF EXISTS lists");
  db.run("DROP TABLE IF EXISTS playlist_tracks");
  db.run("DROP TABLE IF EXISTS resources");
  db.run(TABLE);  
  TABLE = "CREATE TABLE IF NOT EXISTS lists (_id INTEGER PRIMARY KEY, name TEXT, count INTEGER, uuid TEXT)";
  db.run(TABLE);
  TABLE = "CREATE TABLE IF NOT EXISTS playlist_tracks (list_id INTEGER, track_id INTEGER, position INTEGER, FOREIGN KEY(list_id) REFERENCES lists(_id), FOREIGN KEY(track_id) REFERENCES tracks(_id), PRIMARY KEY(list_id,track_id,position))"
  db.run(TABLE);
  TABLE = "CREATE TABLE IF NOT EXISTS resources (id INTEGER PRIMARY KEY, Uri TEXT, ProtocolInfo TEXT, track_id INTEGER, FOREIGN KEY(track_id) REFERENCES tracks(_id))"
  db.run(TABLE);

  db.run("CREATE INDEX artist_index ON tracks(Artist)");
  db.run("CREATE INDEX album_index ON tracks(Album)");
  db.run("CREATE INDEX title_index ON tracks(Title)");
  db.run("CREATE INDEX uri_index ON resources(uri)");

});

module.exports = db;