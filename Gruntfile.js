var JST = require('./helpers/JST'),
    fs = require('fs');
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    nodeunit: {
      all: ['tests/*.js']
    },
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
        'public/javascripts/fastclick.js',
        'public/javascripts/zepto.min.js',
        'public/javascripts/underscore-min.js',
        'public/javascripts/backbone-min.js',
        'public/javascripts/jst/*.js',
        'public/javascripts/wu/*.js',
        'public/javascripts/views/base/*.js',
        'public/javascripts/views/*.js',
        'public/javascripts/models/*.js',
        'public/javascripts/collections/*.js',
        'public/javascripts/routes/*.js',
        'public/javascripts/helpers/*.js',
        'public/javascripts/mixin/*.js'
        ],
        dest: 'public/build/<%= pkg.name %>.js'
      }
    },
    uglify: {
      build: {
        src: 'public/build/<%= pkg.name %>.js',
        dest: 'public/build/<%= pkg.name %>.min.js'
      }
    }
  });

  grunt.registerTask('build-jst','compile templates',function(){
    var done = this.async();
    JST.render(function(result){
      var fileName = 'public/javascripts/jst/jst.js';
      fs.writeFile(fileName,result,function(err){
        if(err){
          throw err;
        }else{
          console.log('File "'+fileName+'" created.');
          done();
        }
      })
    })
  });

  //plugin for running nodeunit
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['nodeunit','build-jst','concat','uglify']);

};
