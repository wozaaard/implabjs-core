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
        },
        {
            name: "dojo",
            location: "node_modules/dojo"
        }
    ],
    nodeRequire: require
});


requirejs(['test/plan']);