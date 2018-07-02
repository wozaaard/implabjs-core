var requirejs = require('requirejs');

requirejs.config({
    baseUrl: '.',
    packages: [{
            name: "core",
            location: "build/dist"
        },
        {
            name: "test",
            location: "build/test"
        }
    ],
    nodeRequire: require
});


requirejs(['test/plan']);