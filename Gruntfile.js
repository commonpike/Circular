module.exports = function(grunt) {
	
	// defines which files should 
	// be copied to dist/docs
	var docpattern = [
		'*/*.md',
		'*/*.html','*/*/*',
		'!*/*.src.html'
	];
	
	var config = {
		release				: 'current',
		source				: 'src',
		destination		: 'dist'
	};
	
	var cwd = process.cwd();
  process.chdir('vendor');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-processhtml');
	process.chdir(cwd);
	grunt.initConfig({
		config	: config,
		clean: {
			before: {
        src: ['<%= config.destination %>/docs/**']
      },
      after: {
        src: ['<%= config.destination %>/docs/**'],
        filter: function(fp) {
          return grunt.file.isDir(fp) && require('fs').readdirSync(fp).length === 0;
        }
      }
    },
		concat: {
			'<%= config.destination %>/js/circular.js' : [
				'vendor/node_modules/esprima/dist/esprima.js',
				'vendor/node_modules/observe-js/src/observe.js',
				'<%= config.source %>/core/*/*.js',
				'<%= config.source %>/base/*/*.js'
			]
		},
		uglify: {
			options: {
				//banner: '/*! Circular	'+(new Date())+'   */\n'
			},
			dist: {
				src: '<%= config.destination %>/js/circular.js',
				dest: '<%= config.destination %>/js/circular.min.js'
			}
		},
		copy: {
			js : {
				expand: true,
				flatten: true,
				src: ['<%= config.source %>/contrib/*/circular.*.js'],
				dest: '<%= config.destination %>/js/',
				filter: 'isFile'
			},
			assets : {
				expand: true,
				cwd: '<%= config.source %>/assets',
				src: ['**'],
				dest: '<%= config.destination %>/docs/assets'
			},
			coredocs : {
				expand: true,
				//flatten: true,
				cwd: '<%= config.source %>/core',
				src: docpattern,
				dest: '<%= config.destination %>/docs/core',
				//filter: 'isDirectory'
			},
			basedocs : {
				expand: true,
				//flatten: true,
				cwd: '<%= config.source %>/base',
				src: docpattern,
				dest: '<%= config.destination %>/docs/base',
				//filter: 'isDirectory'
			},
			contribdocs : {
				expand: true,
				//flatten: true,
				cwd: '<%= config.source %>/contrib',
				src: docpattern,
				dest: '<%= config.destination %>/docs/contrib',
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
          cwd: '<%= config.destination %>',
          src: ['docs/*/*/*.html'],
          dest: '<%= config.destination %>'
      	}]
    	},
    	live: {
				options: {
          process	: true,
          stripUnparsed		: true,
          data		: {
          	release	: '<%= config.release %>'
          }
      	},
      	files: [{
          expand: true,
          cwd: '<%= config.destination %>',
          src: ['docs/*/*/*.html'],
          dest: '<%= config.destination %>'
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

	// run 'grunt release:v2.1' to generate a new release 
	// ready to go online in  'releases/v2.1'.
	
	grunt.registerTask('release', 'Create a new release', function(version) {
		config.release 			= version;
  	config.destination 	= 'releases/'+version;
  	grunt.task.run('live');
  });
  
  grunt.registerTask('live', [
		"clean:before",
		"concat",
		"uglify",
		"copy",
		"processhtml:live",
		"clean:after"
	]);
	
  
	
}