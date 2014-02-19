var JST = require('./helpers/JST'),
    fs = require('fs');
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    nodeunit: {
      all: ['tests/*.js']
    },
    clean: ["public/build"],
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
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: 'public/stylesheets/',
        src: ['*.css', '!*.min.css'],
        dest: 'public/build/',
        ext: '.min.css'
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

  grunt.registerTask('cache-versions','add version tags',function(){
    var done = this.async(),
        cacheBuster = Math.floor(Math.random() * 100000),
        newName,
        data;

    fs.readdir('public/build',function(err,file_paths){
      file_paths.forEach(function(file){
        if(/\.min./.test(file)){
          file = 'public/build/' + file
          newName = file.replace("min","min-"+cacheBuster)
          console.log("Renaming",file,newName)
          fs.renameSync(file,file.replace("min","min-"+cacheBuster))  
        }
      })
      data = fs.readFileSync("views/Wu-prod.jade","utf8")
      //find .min- 5 digit cache buster : and replace with new cache buster
      data = data.replace(/\.min-\d{5}/g,".min-"+cacheBuster)
      console.log("Renaming files in: views/Wu-prod.jade")
      fs.writeFileSync("views/Wu-prod.jade",data)
      done();
    });
  });

  //plugin for running nodeunit
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-clean')

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['nodeunit','clean','build-jst','concat','uglify','cssmin','cache-versions']);

};
