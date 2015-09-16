module.exports = function(grunt) {
	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),   // grunt会读取package.json中的文件信息
		concat : {
			test_grunt : {
				files : {
					'dist/GraphicDesigner.js' : ['src/*', 'src/delegates/*', 'src/inspectors/*', 'src/views/**']
				}
			}
		},
		uglify : {
			test_grunt : {
				options : {
					sourceMap : true
				},
				files : {
					'dist/GraphicDesigner.min.js' : 'dist/GraphicDesigner.js'
				}
			}
		},
		clean : ['dist/*'],
		copy : {
			test_grunt : {
				expand : true,
				src : ['resource/**'],
				dest : 'dist'
			}
		},
		watch : {
			scripts : {
				files : ['src/**/*.js'],
				tasks : ['buildjs'],
				options : {
					interrupt : true
				}
			}
		},
		jshint: {
			beforeconcat: ['src/**.js']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('default', ['clean', 'concat', 'uglify', 'copy']);
	grunt.registerTask('watch', ['watch']);
	grunt.registerTask('buildjs', ['concat', 'uglify']);
};