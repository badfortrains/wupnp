module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
        'public/javascripts/wu/*.js',
        'public/javascripts/views/base/*.js',
        'public/javascripts/views/*.js',
        'public/javascripts/models/*.js',
        'public/javascripts/collections/*.js',
        'public/javascripts/routes/*.js',
        'public/javascripts/helpers/*.js',
        'public/javascripts/mixins/*.js'
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

  grunt.loadNpmTasks('grunt-contrib-concat');

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['concat','uglify']);

};
