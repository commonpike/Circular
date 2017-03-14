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
	grunt.loadNpmTasks('grunt-processhtml');
	process.chdir(cwd);
	grunt.initConfig({
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
    },
		concat: {
			'dist/js/circular.js' : [
				'vendor/node_modules/esprima/dist/esprima.js',
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
			assets : {
				expand: true,
				cwd: 'src/assets',
				src: ['**'],
				dest: 'dist/docs/assets'
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
    
    processhtml : {
			dist: {
				options: {
          process	: true
      	},
      	files: [{
          expand: true,
          cwd: 'dist',
          src: ['docs/*/*/*.html'],
          dest: 'dist'
      	}]
    	},
    	live: {
				options: {
          process	: true
      	},
      	files: [{
          expand: true,
          cwd: 'dist',
          src: ['docs/*/*/*.html'],
          dest: 'dist'
      	}]
    	}
    }
    
	});
	
	// run 'grunt' to generate a working dist folder
	grunt.registerTask('default', [
		"clean:before",
		"concat",
		"uglify",
		"copy",
		"processhtml:dist",
		"clean:after"
	]);

	// run 'grunt release' to generate a new release ready to go online
	// in due time we may add version numbers, git management, ftp and such
	grunt.registerTask('release', [
		"clean:before",
		"concat",
		"uglify",
		"copy",
		"processhtml:live",
		"clean:after"
	]);
	
}