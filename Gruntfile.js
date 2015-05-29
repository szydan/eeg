module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // This line makes your node configurations available for use
    pkg: grunt.file.readJSON('package.json'),
    // This is where we configure JSHint
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      // You get to make the name
      // The paths tell JSHint which files to validate
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        src: ['lib/**/*.js']
      },
      test: {
        src: ['test/eg-helper-test.js']
      }
    },

    jscs: {
      options: {
        config: '.jscsrc'
      },

      // just lint the source dir
      source: {
        src: ['lib/**/*.js']
      },

      // fix any linting errors that can be fixed
      fixup: {
        src: ['lib/**/*.js'],
        options: {
          fix: true
        }
      }
    }

  });
  // Each plugin must be loaded following this pattern
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');


  // Custom task(s).
  // First argument names the task for use in command line
  // Second argument is a list of tasks to be run
  grunt.registerTask('default', ['jshint']);

};
