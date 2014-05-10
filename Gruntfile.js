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
        shell: {
            'run-tests': {
                options: {
                    stdout: true
                },
                command: 'grunt api & grunt test'
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
    grunt.loadNpmTasks('grunt-execute');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('api', [ 'execute:api' ]);
    grunt.registerTask('test', [ 'mocha' ]);
    grunt.registerTask('default', [ 'jshint', 'shell:run-tests', 'watch' ]);
};