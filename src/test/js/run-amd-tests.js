var requirejs = require('requirejs');

requirejs.config({
    baseUrl: '.',
    packages: [{
            name: "@implab/core",
            location: "build/dist/amd"
        },
        {
            name: "test",
            location: "build/test/amd"
        },
        {
            name: "dojo",
            location: "node_modules/dojo"
        }
    ],
    nodeRequire: require
});


requirejs(['test/plan']);