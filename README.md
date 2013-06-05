wupnp
=====
A web interface for playing music tracks from UPNP media servers to UPNP renderers.  Aggregates tracks from
multiple sources into a single interface.  Build playlists and control playback from any desktop or mobile
browser

UPNP functionality is built on the [Platinum UPNP SDK](http://sourceforge.net/projects/platinum/), and accessed through a custom Node.js [C++ module](https://github.com/badfortrains/mediaWatcher) 

Demo
======
Youtube: http://www.youtube.com/watch?v=72oVUozqCjE

![On pc and ipbone](https://raw.github.com/badfortrains/wupnp/master/public/images/screen.png)

Install
=======
To install on the raspberry pi
<ol>
  <li>
    Install Node.js (and npm)
  </li>
  <li>
    Clone wupnp
  </li>
  <li>
    install dependencies by executing 'npm install' in the wupnp directory
  </li>
  <li>
    start the server with 'NODE_ENV=production node app.js' or 'NODE_ENV=production nohup node app.js&' to run it in the background
  </li>
</ol>

This has only been tested on Raspbian “wheezy” hard-float on model B. To run on any other hardware/OS the [media watcher](https://github.com/badfortrains/mediaWatcher) 
module will probably need to be rebuilt.  I'll try to post instructions on doing that shortly
