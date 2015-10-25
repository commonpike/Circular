module.exports = function(grunt) {
	
	var cwd = process.cwd();
  process.chdir('vendor');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	process.chdir(cwd);
	grunt.initConfig({
		copy: {
			dist : {
				expand: true,
				flatten: true,
				src: ['src/js/contrib/*/circular.*.js'],
				dest: 'dist/js/',
				filter: 'isFile'
			}
		},
		concat: {
			dist : {
				'dist/js/Circular.js' : [
					'vendor/node_modules/esprima/esprima.js',
					'vendor/node_modules/observe-js/src/observe.js',
					'src/js/core/circular.core.js',
					'src/js/core/*/*.js',
					'src/js/base/*/*.js'
				]
			}
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
	
	grunt.registerTask('default', ["concat","uglify","copy"]);
}