module.exports = function(grunt){
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
        execute: {
            api: {
                src: ['test/testapi.js']
            }
        },
        mocha: {
            all: {
                src: ['test/testrunner.html']
            },
            options: {
                run: true
            }
        },
        jshint: {
            src: ['discuss.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        uglify: {
            build: {
                files: {
                    'discuss.min.js': ['discuss.js']
                }
            }
        },
        shell: {
            'run-tests': {
                options: {
                    stdout: true
                },
                command: 'grunt api & grunt mocha'
            }
        },
        watch: {
            build: {
                files: [ '**/*.js'],
                tasks: [ 'default' ]
            },
        }
    });

    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-execute');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('api', [ 'execute:api' ]);
    grunt.registerTask('test', [ 'shell:run-tests' ]);
    grunt.registerTask('build', [ 'jshint', 'test', 'uglify' ]);
    grunt.registerTask('default', [ 'build', 'watch' ]);
};