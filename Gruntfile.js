module.exports = function(grunt) {
	
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.initConfig({

		concat: {
			'build/js/Circular.js' : [
				'src/js/circular.core.js', 
				'vendor/node_modules/jquery/dist/jquery.min.js',
				'src/js/circular.root.js',
				'src/js/circular.log.js',
				'src/js/circular.debug.js',
				'vendor/node_modules/esprima/esprima.js',
				'src/js/circular.parser.js',
				'src/js/circular.registry.js',
				'src/js/circular.engine.js',
				'vendor/node_modules/observe-js/src/observe.js',
				'src/js/circular.watchdog.js',
				'src/js/circular.context.js',
				'src/js/circular.content.js',
				'src/js/circular.hide.js'
			],
			'dist/js/Circular.js' : [
				'src/js/circular.core.js', 
				'vendor/node_modules/jquery/dist/jquery.js',
				'src/js/circular.root.js',
				'src/js/circular.log.js',
				'src/js/circular.debug.js',
				'vendor/node_modules/esprima/esprima.js',
				'src/js/circular.parser.js',
				'src/js/circular.registry.js',
				'src/js/circular.engine.js',
				'vendor/node_modules/observe-js/src/observe.js',
				'src/js/circular.watchdog.js',
				'src/js/circular.context.js',
				'src/js/circular.content.js',
				'src/js/circular.hide.js'
			]
		},
		uglify: {
			options: {
				banner: '/*! Circular	.. datestamped   */\n'
			},
			dist: {
				src: 'build/js/Circular.js',
				dest: 'dist/js/Circular.min.js'
			}
		}
	});
	
	grunt.registerTask('default', ["concat","uglify"]);
}