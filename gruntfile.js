module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      src: ['*.js','notifications/*.js','test/*.js'],
      options: {
        ignores: ['test/*.min.js','twilio.js']
      }
    },
    nodemon: {
      dev: {
        options: {
          file: 'app.js',
          args: [],
          ignoredFiles: ['node_modules/**', 'old/**'],
          watchedExtensions: ['js'],
          watchedFolders: ['.'],
          debug: true,
          delayTime: 1,
          cwd: __dirname
          }
        }
    },
  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.registerTask('default', ['jshint', 'nodemon']);
};