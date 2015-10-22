module.exports = function(grunt) {
	
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.initConfig({

		concat: {
			'dist/js/Circular.js' : [
				'vendor/node_modules/esprima/esprima.js',
				'vendor/node_modules/observe-js/src/observe.js',
				'src/js/core/*.js',
				'src/js/base/*.js'
			]
		},
		uglify: {
			options: {
				banner: '/*! Circular	'+(new Date())+'   */\n'
			},
			dist: {
				src: 'dist/js/Circular.js',
				dest: 'dist/js/Circular.min.js'
			}
		}
	});
	
	grunt.registerTask('default', ["concat","uglify"]);
}