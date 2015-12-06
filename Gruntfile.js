module.exports = function(grunt) {
	
	var cwd = process.cwd();
  process.chdir('vendor');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	process.chdir(cwd);
	grunt.initConfig({
		copy: {
			js : {
				expand: true,
				flatten: true,
				src: ['src/contrib/*/circular.*.js'],
				dest: 'dist/js/',
				filter: 'isFile'
			},
			demo : {
				expand: true,
				//flatten: true,
				cwd: 'src/contrib',
				src: ['*/demo*','*/demo*/*'],
				dest: 'dist/demo/',
				//filter: 'isDirectory'
			}
		},
		concat: {
			'dist/js/circular.js' : [
				'vendor/node_modules/esprima/esprima.js',
				'vendor/node_modules/observe-js/src/observe.js',
				'src/core/circular.core.js',
				'src/core/*/*.js',
				'src/base/*/*.js'
			]
		},
		uglify: {
			options: {
				//banner: '/*! Circular	'+(new Date())+'   */\n'
			},
			dist: {
				src: 'dist/js/circular.js',
				dest: 'dist/js/circular.min.js'
			}
		}
	});
	
	grunt.registerTask('default', ["concat","uglify","copy"]);
}