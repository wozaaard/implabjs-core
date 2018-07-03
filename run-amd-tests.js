var requirejs = require('requirejs');

requirejs.config({
    baseUrl: '.',
    map: {
        "*": {
            "@implab/core": "core"
        }
    },
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