module.exports = function(grunt) {
	
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.initConfig({

		concat: {
			'build/js/Circular.js' : [
				'src/js/circular.core.js', 
				'vendor/node_modules/jquery/dist/jquery.min.js',
				'src/js/circular.core.root.js',
				'src/js/circular.core.log.js',
				'src/js/circular.core.debug.js',
				'vendor/node_modules/esprima/esprima.js',
				'src/js/circular.core.parser.js',
				'src/js/circular.core.registry.js',
				'src/js/circular.core.engine.js',
				'vendor/node_modules/observe-js/src/observe.js',
				'src/js/circular.core.watchdog.js',
				'src/js/circular.base.context.js',
				'src/js/circular.base.content.js',
				'src/js/circular.base.hide.js'
			],
			'dist/js/Circular.js' : [
				'src/js/circular.core.js', 
				'vendor/node_modules/jquery/dist/jquery.min.js',
				'src/js/circular.core.root.js',
				'src/js/circular.core.log.js',
				'src/js/circular.core.debug.js',
				'vendor/node_modules/esprima/esprima.js',
				'src/js/circular.core.parser.js',
				'src/js/circular.core.registry.js',
				'src/js/circular.core.engine.js',
				'vendor/node_modules/observe-js/src/observe.js',
				'src/js/circular.core.watchdog.js',
				'src/js/circular.base.context.js',
				'src/js/circular.base.content.js',
				'src/js/circular.base.hide.js'
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