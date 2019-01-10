var rjs = require('requirejs');

rjs.config({
    baseUrl: '.',
    packages: [{
            name: "@implab/core",
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


rjs(['test/plan']);