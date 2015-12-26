module.exports = function(grunt) {
	
	// defines which files should 
	// be copied to dist/docs
	var docpattern = [
		'*/*.md',
		'*/*.html','*/*/*',
		'!*/*.src.html'
	];
	
	var cwd = process.cwd();
  process.chdir('vendor');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	process.chdir(cwd);
	grunt.initConfig({
		concat: {
			'dist/js/circular.js' : [
				'vendor/node_modules/esprima/esprima.js',
				'vendor/node_modules/observe-js/src/observe.js',
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
		},
		copy: {
			js : {
				expand: true,
				flatten: true,
				src: ['src/contrib/*/circular.*.js'],
				dest: 'dist/js/',
				filter: 'isFile'
			},
			coredocs : {
				expand: true,
				//flatten: true,
				cwd: 'src/core',
				src: docpattern,
				dest: 'dist/docs/core',
				//filter: 'isDirectory'
			},
			basedocs : {
				expand: true,
				//flatten: true,
				cwd: 'src/base',
				src: docpattern,
				dest: 'dist/docs/base',
				//filter: 'isDirectory'
			},
			contribdocs : {
				expand: true,
				//flatten: true,
				cwd: 'src/contrib',
				src: docpattern,
				dest: 'dist/docs/contrib',
				//filter: 'isDirectory'
			}
		},
		clean: {
			before: {
        src: ['dist/docs/**']
      },
      after: {
        src: ['dist/docs/**'],
        filter: function(fp) {
          return grunt.file.isDir(fp) && require('fs').readdirSync(fp).length === 0;
        }
      }
    }
	});
	
	grunt.registerTask('default', ["clean:before","concat","uglify","copy","clean:after"]);
}